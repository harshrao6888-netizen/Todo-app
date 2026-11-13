import mongoose from 'mongoose';

export const PRIORITIES = ['low', 'medium', 'high'];
export const STATUSES = ['in_progress', 'completed'];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title must be at most 200 characters'],
    },
    description: { type: String, trim: true, default: '', maxlength: 2000 },
    // The task's scheduled date & time (mandatory).
    startAt: { type: Date, required: [true, 'Date & time is required'] },
    // Optional end time ("Ends" in the design).
    endAt: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          if (!value) return true;
          const start = this instanceof mongoose.Query ? this.get('startAt') : this.startAt;
          return !start || value >= start;
        },
        message: 'End time must be after the start time',
      },
    },
    priority: {
      type: String,
      enum: { values: PRIORITIES, message: 'Priority must be low, medium or high' },
      default: null,
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: 'Status must be in_progress or completed' },
      default: 'in_progress',
    },
  },
  { timestamps: true }
);

taskSchema.index({ startAt: 1 });

export default mongoose.model('Task', taskSchema);
