import Joi from "joi";

interface CreateSessionDTO {
  startYear: number;
  endYear: number;
}

export const validate = (schema: Joi.Schema, data: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false });    
    if (error) {
        const errorDetails = error.details.map((detail) => detail.message);
        throw new Error(`Validation error: ${errorDetails.join(", ")}`);
    }
    return value;
}

export const validateStudentCreation = (data: any) => {
    const schema = Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        dateOfBirth: Joi.date().optional(),
        departmentId: Joi.string().required(),
        userId: Joi.string().required(),
        level: Joi.number().valid(100, 200, 300, 400, 500).optional(),
        admissionType: Joi.string().valid("UTME", "DIRECT_ENTRY", "TRANSFER").optional(),
    });
    return validate(schema, data);
}

export const validateCourseCreation = (data: any) => {
    const schema = Joi.object({
        title: Joi.string().required(), 
        code: Joi.string().required().uppercase(),
        creditUnits: Joi.number().required().min(1),
        department: Joi.string().required(),    
        semester: Joi.string().valid("FIRST", "SECOND").required(),
        level: Joi.number().valid(100, 200, 300, 400, 500).required(),
        type: Joi.string().valid("CORE", "ELECTIVE").required(),
    });
    return validate(schema, data);
}


export const validateSessionCreation = (data: any) => {
    const schema = Joi.object({
        startYear: Joi.number().required().min(1900).max(2100), 
        endYear: Joi.number().required().min(1900).max(2100).greater(Joi.ref("startYear")),
    });
    return validate(schema, data);
}

export const validateSemesterCreation = (data: any) => {
    const schema = Joi.object({
        name: Joi.string().valid("FIRST", "SECOND").required(),
        sessionId: Joi.string().required(),
    });
    return validate(schema, data);
}

export const validateFacultyCreation = (data: any) => {
    const schema = Joi.object({
        code: Joi.string().required().uppercase(),
        name: Joi.string().required().trim()
    })
    return validate(schema, data);

}

export const validateDepartmentCreation = (data: any) => {
    const schema = Joi.object({
        code: Joi.string().required().uppercase(),  
        name: Joi.string().required().trim(),
        facultyId: Joi.string().required(),
    })
    return validate(schema, data);
}