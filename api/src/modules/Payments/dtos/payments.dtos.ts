export type InitiatePaymentDto = {
  registrationId: string;
  studentId: string
}

export type VerifyPaymentDto = {
  reference: string;
}