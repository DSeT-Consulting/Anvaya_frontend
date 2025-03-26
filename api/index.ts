import axios, { AxiosError, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { DocumentPickerAsset } from 'expo-document-picker';

// url based on backend host
// const baseUrl = 'http://192.168.43.147:8080'; 
// const baseUrl = 'http://localhost:8080'; 
const baseUrl = "https://healthcare-backend-dev.vercel.app";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

interface UserCredentials {
  email: string;
  password: string;
}

interface DoctorData {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
}

interface PatientData {
  personal_details: {
      email: string;
      name: string;
      password: string;
      phoneNumber: string;
      adharCard: string;
      gender?: "MALE" | "FEMALE" | "OTHER";
      age?: number;
      address?: string;
      pincode?: number;
  };
  medical_history?: {
      preExistingConditions?: string;
      currentMedications?: string;
  };
  symptoms_vitals?: {
      appointmentDate: Date;
      symptoms?: string[];
      bloodPressure?: string;
      temperature?: string;
      sugarLevel?: string;
      pulseRate?: string;
  };
  doctor_notes?: {
      diagnosis?: string;
      treatmentAdvice?: string;
      nextAppointmentDate?: Date;
  };
}

interface AppointmentData {
  patientId: string
  appointmentDate: Date
  appointmentTime: string
  reason: string
  notes: string
}

interface FileData {
  files: DocumentPickerAsset[];
}

// Determine if we're running on web or native
const isWeb = Platform.OS === 'web';

// Cross-platform storage methods
const getAuthToken = async (): Promise<string | null> => {
  try {
    if (isWeb) {
      return localStorage.getItem('userToken');
    } else {
      return await SecureStore.getItemAsync('userToken');
    }
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

const setAuthToken = async (token: string): Promise<void> => {
  try {
    if (isWeb) {
      localStorage.setItem('userToken', token);
    } else {
      await SecureStore.setItemAsync('userToken', token);
    }
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

const removeAuthToken = async (): Promise<void> => {
  try {
    if (isWeb) {
      localStorage.removeItem('userToken');
    } else {
      await SecureStore.deleteItemAsync('userToken');
    }
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

const apiRequest = async <T>(
  method: 'get' | 'post' | 'put' | 'delete',
  endpoint: string,
  data?: any,
  requiresAuth = true,
  isMultipart = false //
): Promise<ApiResponse<T>> => {
  try {
    let headers: Record<string, string> = {};
    console.log("Is multipart ",isMultipart)
    if (!isMultipart) {
      headers["Content-Type"] = "application/json";
    }else{
      headers["Content-Type"] = "multipart/form-data";
    }


    if (requiresAuth) {
      const token = await getAuthToken();
      if (!token) {
        return {
          success: false,
          message: 'Authentication token not available',
        };
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      url: `${baseUrl}${endpoint}`,
      headers,
      data: method !== 'get' ? data : undefined,
      params: method === 'get' ? data : undefined,
    };

    const response: AxiosResponse = await axios(config);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    console.log(`API Error (${endpoint}):`, axiosError.response);

    return {
      success: false,
      message:
        (axiosError.response?.data as any)?.error as string ||
        (axiosError.response?.data as any)?.errors?.join(', ') ||
        axiosError.message ||
        'Something went wrong with the request',
    };
  }
};

export const signUp = async (userData: any): Promise<ApiResponse<any>> => {
  const response = await apiRequest<any>('post', '/api/signup', userData, false);  
  return response;
};

export const login = async (credentials: UserCredentials): Promise<ApiResponse<any>> => {
  console.log("credentials", credentials);
  const response = await apiRequest<any>('post', '/api/login', credentials, false);
  if (response.success && response.data?.token) {
    await setAuthToken(response.data.token);
  }
  return response;
};

export const verifyToken = async (): Promise<ApiResponse<{ valid: boolean; user?: any }>> => {
  return await apiRequest('get', '/api/verify-token');
};

export const logout = async (): Promise<void> => {
  await removeAuthToken();
};

// Doctor
export const createDoctor = async (doctorData: DoctorData): Promise<ApiResponse<any>> => {
  const data = {
    ...doctorData,
  };
  return await apiRequest<any>('post', '/api/register', data, false);
};

export const createPatient = async (patientData: PatientData): Promise<ApiResponse<any>> => {
  const data = {
    ...patientData,
  };
  return await apiRequest<any>('post', '/api/patients', data, true);
};

export const searchPatient = async (id: string): Promise<ApiResponse<any>> => {
  return await apiRequest<any>('get', `/api/patients/search/${id}`, undefined, true);
};

export const verifyPatientOTP = async (id: string, otp: string): Promise<ApiResponse<any>> => {
  const data = {
    otp
  };
  return await apiRequest<any>('post', `/api/patients/verify-otp/${id}`, data, true);
};

export const getPatientDetail = async (id: string): Promise<ApiResponse<any>> => {
  return await apiRequest<any>('get', `/api/patients/${id}`, undefined, true);
};

export const createAppointment = async (appointmentData: AppointmentData): Promise<ApiResponse<any>> => {
  const data = {
    ...appointmentData,
  };
  return await apiRequest<any>('post', '/api/appointments', data, true);
};



export const uploadDocument = async (
  id: string,
  fileData: FileData
): Promise<ApiResponse<any>> => {
  const formData = new FormData();

  console.log("fileData", fileData);

  fileData.files.forEach((file) => {
      formData.append("files", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/octet-stream",
      } as any);
  });

  return await apiRequest<any>("post", `/api/patients/${id}/documents`, formData, true, true);
};


// Admin
export const getAdminDashboard = async (): Promise<ApiResponse<any>> => {
  return await apiRequest<any>('get', `/api/admin/dashboard`, undefined, true);
};


//patient
export const getMyProfile = async (): Promise<ApiResponse<any>> => {
  return await apiRequest<any>('get', `/api/my-profile`, undefined, true);
};

export const deleteDocument = async (patientId:string,docUrl:string): Promise<ApiResponse<any>> => {
  return await apiRequest<any>('delete', `/api/patients/${patientId}/documents/${docUrl}`, undefined, true);
};

export const getMyAppointments = async (status:string): Promise<ApiResponse<any>> => {
  return await apiRequest<any>('get', `/api/patient/appointments?status=${status}`, undefined, true);
};


export const cancelAppointment = async (id:string): Promise<ApiResponse<any>> => {
  return await apiRequest<any>('put', `/api/patient/appointments/${id}/cancel`, undefined, true);
};


