const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const User = require('../models/User');

/**
 * POST /signup/upload
 * Save profile picture on signup.
 */

exports.postSignupPicture = async (req, res, next) => {
  const { filename } = req.file;
  const { email } = req.headers;

  const oldPath = path.resolve(__dirname, `../public/uploads/tmp/${filename}`);
  const newPath = path.resolve(__dirname, `../public/uploads/${filename}`);

  try {
    await sharp(oldPath)
      .resize(240, 240, {
        kernel: sharp.kernel.lanczos2,
        interpolator: sharp.interpolator.nohalo,
      })
      .toFile(newPath)
      .catch(e => console.log(e));
  } catch (e) {
    fs.unlinkSync(oldPath);
    return res.send({ errorPic: [{ param: 'picture', msg: 'error.imageOnly' }] });
  }
  if (fs.existsSync(oldPath)) {
    fs.unlinkSync(oldPath);
  }
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.send({ errorPic: [{ param: 'email', msg: 'error.noEmailUsed' }] });
      }
      user.profile.picture = filename;
      user.profile.pictureURL = `/static/uploads/${filename}`;
      user.save((err) => {
        if (err) { return next(err); }
        return res.send({ errorPic: [] });
      });
    });
};

/**
 * POST /profile_pic
 * Update profile picture on profile.
 */

exports.newPicture = async (req, res, next) => {
  const { filename } = req.file;
  const tmpPath = path.resolve(__dirname, `../public/uploads/tmp/${filename}`);
  const newPath = path.resolve(__dirname, `../public/uploads/${filename}`);

  try {
    await sharp(tmpPath)
      .resize(240, 240, {
        kernel: sharp.kernel.lanczos2,
        interpolator: sharp.interpolator.nohalo,
      })
      .toFile(newPath);
  } catch (e) {
    fs.unlinkSync(tmpPath);
    return res.send({ errorPic: [{ param: 'picture', msg: 'error.imageOnly' }] });
  }
  if (fs.existsSync(tmpPath)) {
    fs.unlinkSync(tmpPath);
  }
  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    if (!user) {
      return res.send({ errorPic: [{ param: 'email', msg: 'error.noEmailUsed' }] });
    }
    if (user.profile.picture) {
      const oldPath = path.resolve(__dirname, `../public/uploads/${user.profile.picture}`);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    user.profile.picture = filename;
    user.profile.pictureURL = `/static/uploads/${filename}`;
    user.save((err) => {
      if (err) { return next(err); }
      return res.send({ errorPic: [], pictureURL: user.profile.pictureURL });
    });
  });
};
