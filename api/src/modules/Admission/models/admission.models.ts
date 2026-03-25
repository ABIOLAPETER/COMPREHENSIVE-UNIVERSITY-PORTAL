import mongoose, { Schema, Document, Types, Date } from "mongoose";

export enum EntryType {
    JAMB = "JAMB",
    DE = "DE"
}

export interface IAdmission extends Document {
    jambRegNo: string
    firstName: string
    lastName: string
    middleName: string
    dateOfBirth: Date
    gender: string
    department: string
    faculty: string
    entryType: EntryType
    admissionYear: number
    isActivated: boolean
    activatedAt: Date
}

const AdmissionSchema = new Schema<IAdmission>(
    {
        jambRegNo: {
            type: String,
            required: true,
        },
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        middleName: {
            type: String,
            required: true,
        },
        dateOfBirth: {
            type: Date,
            required: true,
        },
        department: {
            type: String,
            required: true,
        },
        faculty: {
            type: String,
            required: true,
        },
        
        gender: {
            type: String,
            required: true,
        },
        entryType: {
            type: String,
            enums: Object.values(EntryType),
        },
        
        admissionYear: {
            type: Number,
        },
        isActivated: {
            type: Boolean
        },
        activatedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);


export const AdmissionModel = mongoose.model<IAdmission>("Admission", AdmissionSchema);