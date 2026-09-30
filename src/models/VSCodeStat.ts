import mongoose, { Schema, Document } from 'mongoose';

export interface IVSCodeStat extends Document {
  date: string; // Format: YYYY-MM-DD for easy daily lookup
  totalTimeSeconds: number;
  filesModified: number;
  foldersCreated: number;
  languages: {
    name: string;
    timeSeconds: number;
  }[];
}

const VSCodeStatSchema = new Schema<IVSCodeStat>(
  {
    date: { type: String, required: true, unique: true },
    totalTimeSeconds: { type: Number, default: 0 },
    filesModified: { type: Number, default: 0 },
    foldersCreated: { type: Number, default: 0 },
    languages: [
      {
        name: { type: String, required: true },
        timeSeconds: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

export const VSCodeStat = mongoose.models.VSCodeStat || mongoose.model<IVSCodeStat>('VSCodeStat', VSCodeStatSchema);