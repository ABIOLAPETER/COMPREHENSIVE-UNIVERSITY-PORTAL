import { ISession } from "../model/session.model"

export type CreateSessionDto = Partial<Pick<ISession, "startYear" | "endYear">>
export type ActivateSessionDto = {
    sessionId: string
}