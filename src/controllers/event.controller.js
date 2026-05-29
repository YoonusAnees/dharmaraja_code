import Event from "../models/model.event.js";
import { createNotification } from "../services/notification.service.js";

export const createEvent = async (req, res, next) => {
  try {
    const eventData = { ...req.body };
    if (req.file) {
      eventData.image = req.file.path;
    }
    const event = await Event.create(eventData);

    await createNotification({
      title: "New Event",
      message: event.title,
      type: "event",
      isBroadcast: true,
    });

    req.io?.emit("new-notification", {
      title: "New Event",
      message: event.title,
    });

    res.status(201).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

export const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ status: "active" }).sort("-createdAt");
    res.json({ success: true, events });
  } catch (error) {
    next(error);
  }
};