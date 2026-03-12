const express = require('express');
const notification_route = express();

const bodyParser = require('body-parser');
notification_route.use(bodyParser.json());
notification_route.use(bodyParser.urlencoded({ extended: true }));

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const notificationController = require('../controllers/notificationController');

notification_route.post('/create-notification', upload.none(), notificationController.createNotification);
notification_route.get('/get-notifications', notificationController.getNotifications);
notification_route.delete('/delete-notification/:id', notificationController.deleteNotification);
notification_route.post('/mark-all-read', upload.none(), notificationController.markAllAsRead);

module.exports = notification_route;
