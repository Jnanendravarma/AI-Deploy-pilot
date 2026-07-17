const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: GitHubStrategy } = require('passport-github2');
const env = require('./env');
const { userRepository } = require('../repositories/userRepository');

function configurePassport() {
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${env.OAUTH_CALLBACK_URL}/google/callback`
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const avatar = profile.photos?.[0]?.value;
        let user = await userRepository.findByEmail(email);
        if (!user) {
          user = await userRepository.create({
            name: profile.displayName || 'Google User',
            email,
            avatar,
            oauthProviders: { googleId: profile.id }
          });
        } else {
          if (!user.avatar && avatar) {
            user.avatar = avatar;
            await user.save();
          }
        }
        done(null, user);
      } catch (error) {
        done(error);
      }
    }));
  }

  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackURL: `${env.OAUTH_CALLBACK_URL}/github/callback`,
      scope: ['user:email']
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || `${profile.username}@users.noreply.github.com`;
        const avatar = profile.photos?.[0]?.value || profile._json?.avatar_url;
        let user = await userRepository.findByEmail(email);
        if (!user) {
          user = await userRepository.create({
            name: profile.displayName || profile.username,
            email,
            avatar,
            oauthProviders: { githubId: profile.id }
          });
        } else {
          if (!user.avatar && avatar) {
            user.avatar = avatar;
            await user.save();
          }
        }
        done(null, user);
      } catch (error) {
        done(error);
      }
    }));
  }
}

module.exports = { passport, configurePassport };
