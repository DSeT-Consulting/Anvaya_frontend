import Toast from "react-native-toast-message";

export const showToast = (type:string,message:string)=>{
    Toast.show({
        type: type,
        text1: message,
    });
}