const jwt = require('jsonwebtoken');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const test = 0;
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
const createNotification = async (req, res) => {
  const {
    titlePT,
    titleES,
    titleEN,
    descriptionPT,
    descriptionES,
    descriptionEN
  } = req.body;

  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const decoded = jwt.verify(token, 'MY_JWT_SECRET');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!Array.isArray(user.roles) || !user.roles.includes('GlobalOrganizer')) {
      return res.status(403).json({ success: false, message: 'Only GlobalOrganizer can create notifications.' });
    }

    const hasAnyTitle = [titlePT, titleES, titleEN].some((value) => !!String(value || '').trim());
    if (!hasAnyTitle) {
      return res.status(400).json({ success: false, message: 'At least one title is required.' });
    }

    const notification = new Notification({
      titlePT: String(titlePT || '').trim(),
      titleES: String(titleES || '').trim(),
      titleEN: String(titleEN || '').trim(),
      descriptionPT: String(descriptionPT || '').trim(),
      descriptionES: String(descriptionES || '').trim(),
      descriptionEN: String(descriptionEN || '').trim(),
      createdBy: {
        _id: user._id,
        name: user.name || ''
      },
      createdAt: new Date()
    });

    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification created successfully.',
      data: notification
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({}).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Notifications found.',
      data: notifications
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const decoded = jwt.verify(token, 'MY_JWT_SECRET');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await Notification.updateMany(
      { 'readBy.userId': { $ne: user._id } },
      { $push: { readBy: { userId: user._id, readAt: new Date() } } }
    );

    return res.status(200).json({ success: true, message: 'Notifications marked as read.' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  const { id } = req.params;

  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const decoded = jwt.verify(token, 'MY_JWT_SECRET');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!Array.isArray(user.roles) || !user.roles.includes('GlobalOrganizer')) {
      return res.status(403).json({ success: false, message: 'Only GlobalOrganizer can remove notifications.' });
    }

    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    return res.status(200).json({ success: true, message: 'Notification removed successfully.' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  deleteNotification,
  markAllAsRead
};
