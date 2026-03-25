import { ClientSession } from "mongoose";
import { IdCounterModel } from "../models/idCounter";

export class CounterService {
  static async generateSequence(
    year: number,
    session: ClientSession
  ): Promise<number> {

    const counter = await IdCounterModel.findOneAndUpdate(
      { year },                      
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