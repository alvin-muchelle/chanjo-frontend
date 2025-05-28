export interface Baby {
  id: string;
  baby_name: string;
  date_of_birth: string; // formatted as "YYYY-MM-DD"
  gender: string;
}

export interface ProfileResponse {
  mustResetPassword: boolean;
  profileComplete: boolean;
  mother: {
    full_name: string;
    phone_number: string;
  } | null;
  babies: Baby[];
}
