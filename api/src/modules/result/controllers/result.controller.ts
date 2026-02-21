

import { ResultModel } from "../models/result.model"
import { ValidationError, BadRequestError, NotFoundError, ConflictError } from "../../../shared/errors/AppError"
import { Number, Types } from "mongoose"
import { SemesterService } from "../../semester/services/semester.services"
import { SessionService } from "../../session/services/session.services"
import { generateGradeFromScore, generateGradePointFromGrade, isPassed } from "../../../shared/utils/generateGradeFromScore"

import Student from "../../student/models/student.model"
import { CourseModel } from "../../course/models/course.model"
export class ResultService{
    static async createDraftResultService(data:{
        student: Types.ObjectId,
        course: Types.ObjectId,
        department: Types.ObjectId,
        score: number,        
    } ){
        const semester = await SemesterService.getActiveSemester()

        const session = await SessionService.getActiveSession()

        const resultExists = await ResultModel.findOne({student: data.student, course: data.course, semester: semester._id, session: session._id })

        if (resultExists){
            throw new ConflictError("The result already Exists")
        }

        const grade = generateGradeFromScore(data.score)

        const level = await Student.findById(data.student).select("level")

        const gradePoint = generateGradePointFromGrade(grade)

        const creditUnits = await CourseModel.findById(data.course).select("creditUnits")

        const ispassed = isPassed(grade)

        const isCarryover = true ? isPassed : false

        await ResultModel.create({
            student: data.student,
            course: data.course,
            department: data.department,
            session: session._id,
            semester: semester._id,
            level,
            score: data.score,
            grade,
            gradePoint,
            creditUnits,
            isPassed,
            isCarryOver,
            status: "DRAFT"
        })
    }
}