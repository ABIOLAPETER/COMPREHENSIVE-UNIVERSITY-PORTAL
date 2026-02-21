export const generateMatricNumber = (facultyCode: string,departmentCode: string, year: number, sequence: number): string => {
    const sequenceStr = sequence.toString().padStart(4, "0");
    return `UNIV/${facultyCode}/${departmentCode}/${year}/${sequenceStr}`;
}