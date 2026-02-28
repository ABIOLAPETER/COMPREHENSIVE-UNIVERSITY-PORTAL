import { ClientSession } from "mongoose";
import { MatricCounterModel } from "../models/matric.model";

export class CounterService {
  static async generateSequence(
    year: number,
    session: ClientSession
  ): Promise<number> {

    const counter = await MatricCounterModel.findOneAndUpdate(
      { year },                      // 🔥 ONLY YEAR
      { $inc: { currentSequence: 1 } },
      {
        new: true,
        upsert: true,
        session,
      }
    );

    return counter.currentSequence;
  }
}