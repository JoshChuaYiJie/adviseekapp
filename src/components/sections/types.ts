
export interface AboutMeProps {
  user: {
    email?: string;
    profile?: {
      riasec_code?: string;
      work_value_code?: string;
    };
  } | null;
}
