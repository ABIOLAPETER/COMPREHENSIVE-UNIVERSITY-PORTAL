import { Types } from "mongoose";
import { Grade } from "../../modules/result/models/result.model";
import { BadRequestError } from "../errors/AppError";
import { IResult } from "../../modules/result/models/result.model";

export const generateGradeFromScore = (score: number): Grade => {
    if (score < 0 || score > 100) {
        throw new Error("Score must be between 0 and 100");
    }

    if (score < 40) return Grade.F;
    if (score < 45) return Grade.E;
    if (score < 50) return Grade.D;
    if (score < 60) return Grade.C;
    if (score < 70) return Grade.B;
    return Grade.A;
};



export const generateGradePointFromGrade = (grade: Grade): number => {
    switch (grade) {
        case Grade.F: return 0;
        case Grade.E: return 1;
        case Grade.D: return 2;
        case Grade.C: return 3;
        case Grade.B: return 4;
        case Grade.A: return 5;
        default:
            throw new Error("Invalid grade");
    }
};


export const isPassed = (grade: Grade): boolean =>{
    switch (grade){
        case Grade.D: return true;
        case Grade.C: return true;
        case Grade.B: return true;
        case Grade.A: return true;

        default: 
            throw new BadRequestError("Invalid grade")
    }
}



export const generateGPA = (results: IResult[]): number => {
    let totalGradeUnits = 0;
    let totalUnits = 0;

    for (const result of results) {
        const GPU = result.gradePoint * result.creditUnits;
        totalGradeUnits += GPU;
        totalUnits += result.creditUnits;
    }

    if (totalUnits === 0) return 0.00;

    const gpa = totalGradeUnits / totalUnits;

    return Number(gpa.toFixed(2));
};