
import { Request, Response } from "express";
import { RegistrationService } from "../services/registrationService"; 


export class RegistrationController {
    
    
    static async createDraftReg(req: Request, res: Response) {
        try {
            const { studentId } = req.params;
            const draft = await RegistrationService.createDraftRegistration(
                studentId.toString()
            );
            res.status(201).json({
                message: "Draft registration created successfully",
                draft,
            });
        } catch (err) {
            res.status(400).json({ error: err instanceof Error ? err.message : "Create faculty failed" });
        }
    }

    static async addCourseToReg(req: Request, res: Response) {
        try {
            const { courseid, registrationid } = req.params

            const courseId = courseid.toString()
            const registrationId = registrationid.toString()
            const data = { registrationId, courseId }
            
            const addedCourse = await RegistrationService.addCourseToRegistration(data);
            res.status(201).json({
                message: "Course added successfully",
                addedCourse,
            });
        } catch (err) {
            res.status(400).json({ error: err instanceof Error ? err.message : "adding course failed" });
        }
    }

    static async submitReg(req: Request, res: Response) {
        try {
            const { registrationId } = req.params;
            
            const submittedReg = await RegistrationService.submitRegistration(registrationId.toString()
            );
            res.status(200).json({
                message: "registration Submitted successfully",
                submittedReg,
            });
        }
        catch (err) {
            res.status(404).json({ error: err instanceof Error ? err.message : "Error submitting registration" });
        }
    }

    

}