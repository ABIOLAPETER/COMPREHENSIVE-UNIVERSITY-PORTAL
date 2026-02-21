import { ClientSession } from "mongoose";
import { MatricCounterModel } from "../models/matric.model";

export class CounterService {
  static async generateSequence(
    data: {
      facultyCode: string;
      departmentCode: string;
      year: number;
    },
    session: ClientSession
  ) {
    const { facultyCode, departmentCode, year } = data;

    const counter = await MatricCounterModel.findOneAndUpdate(
      { facultyCode, departmentCode, year },
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