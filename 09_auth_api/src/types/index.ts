import type { SignOptions, Algorithm } from 'jsonwebtoken';

export namespace API_Request_NS {
  export interface SignInData {
    email: string;
    password: string;
  }

  export interface SignUpData {
    email: string;
    password: string;
  }
}

export namespace API_Response_NS {
  export interface Status {
    success: boolean;
  }

  export interface SignInData extends Status {
    data: {
      id: number;
      accessToken: string;
      refreshToken: string;
    };
  }

  export interface SignUpData extends Status {
    data: {
      id: number;
      accessToken: string;
      refreshToken: string;
    };
  }
}

export namespace User_NS {
  export interface Create {
    email: string;
    password: string;
  }

  export interface Read {
    id: number;
    email: string;
    created_at: string;
    password: string;
  }
}

export namespace Data_NS {
  export interface Session {
    user_id: number;
    refresh_token: string;
  }

  export interface SchemaValidation {
    data: keyof API_Request_NS.SignInData | keyof API_Request_NS.SignUpData;
    type: string | number;
    min: number;
    max: number;
  }
}

export interface JwtConfig {
  secret: string;
  options: SignOptions;
}

export type JwtAlgorithm = Algorithm;
