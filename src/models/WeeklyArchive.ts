import mongoose, { Schema, Document } from 'mongoose';

export interface IWeeklyArchive extends Document {
  weekStartDate: Date; // The Monday the week started
  weekEndDate: Date;   // The Sunday 11:59 PM the week ended
  totalTimeSeconds: number;
  totalFilesModified: number;
  topLanguages: {
    name: string;
    timeSeconds: number;
  }[];
}

const WeeklyArchiveSchema = new Schema<IWeeklyArchive>(
  {
    weekStartDate: { type: Date, required: true },
    weekEndDate: { type: Date, required: true },
    totalTimeSeconds: { type: Number, required: true },
    totalFilesModified: { type: Number, default: 0 },
    topLanguages: [
      {
        name: { type: String, required: true },
        timeSeconds: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const WeeklyArchive = mongoose.models.WeeklyArchive || mongoose.model<IWeeklyArchive>('WeeklyArchive', WeeklyArchiveSchema);