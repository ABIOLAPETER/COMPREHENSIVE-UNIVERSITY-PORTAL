import { SemesterNames } from "../model/semester.model";

export type CreateSemesterDto = {
  name: SemesterNames;
  sessionId: string;
}