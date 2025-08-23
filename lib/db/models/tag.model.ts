import { Document, Model, model, models, Schema } from 'mongoose'

export interface ITag extends Document {
  name: string
}

const tagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Enforce unique tag names
    },
  },
  {
    timestamps: true,
  }
)

const Tag = (models.Tag as Model<ITag>) || model<ITag>('Tag', tagSchema)

export default Tag
