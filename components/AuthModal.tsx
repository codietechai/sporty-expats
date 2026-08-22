import i18n from "@/translations/i18n";
import { useSignIn, useSignUp, useUser } from "@clerk/clerk-expo";
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ToastAndroid,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import SocialLoginButton from "./SocialLoginButtons";

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called after any successful login / sign-up so the parent can navigate. */
  onSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose, onSuccess }) => {
  const [mode, setMode] = useState<
    | "Login"
    | "Sign Up"
    | "verification"
    | "Reset Password"
    | "Reset Verification"
  >("Login");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { isLoaded, signUp, setActive } = useSignUp();
  const {
    signIn,
    setActive: setLoginActive,
    isLoaded: loginLoaded,
  } = useSignIn();
  const { user } = useUser();

  /** Close the modal then navigate via the parent's callback. */
  const handleSuccess = (message: string) => {
    ToastAndroid.show(message, 2);
    onClose();
    onSuccess?.();
  };

  const onSignInPress = async () => {
    if (!loginLoaded) return;
    try {
      const signInAttempt = await signIn!.create({
        identifier: emailAddress,
        password,
      });
      if (signInAttempt.status === "complete") {
        await setLoginActive({ session: signInAttempt.createdSessionId });
        await user?.reload();
        handleSuccess(i18n.t("SignIn.messages.loggedIn"));
      }
    } catch (err: any) {
      const message = err?.errors?.[0]?.message || err.message || i18n.t("SignIn.messages.loginFailed");
      ToastAndroid.show(message, 2);
    }
  };

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setEmailError("");
    setUsernameError("");
    setPasswordError("");
    try {
      const result = await signUp.create({
        emailAddress,
        password,
        username,
      });
      if (result.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        ToastAndroid.show(i18n.t("SignUp.messages.verificationSent"), 2);
        setMode("verification");
      } else if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        await user?.reload();
        handleSuccess(i18n.t("SignUp.messages.signedUp"));
      }
    } catch (err: any) {
      const errors = err?.errors || [];
      errors.forEach((e: any) => {
        if (e.meta?.paramName === "email_address") setEmailError(e.message);
        else if (e.meta?.paramName === "username") setUsernameError(e.message);
        else if (e.meta?.paramName === "password") setPasswordError(e.message);
      });
    }
  };

  const onVerifyPress = async () => {
    try {
      const result = await signUp!.attemptEmailAddressVerification({
        code: verificationCode,
      });
      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
        await user?.reload();
        setMode("Login");
        handleSuccess("Email verified successfully");
      }
    } catch {
      ToastAndroid.show(i18n.t("SignUp.messages.invalidCode"), 2);
    }
  };

  const onSendResetEmail = async () => {
    try {
      await signIn!.create({
        strategy: "reset_password_email_code",
        identifier: emailAddress,
      });
      ToastAndroid.show(i18n.t("SignIn.messages.resetCodeSent"), 2);
      setMode("Reset Verification");
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.message || err.message || i18n.t("SignIn.messages.resetEmailFailed");
      ToastAndroid.show(message, 2);
    }
  };

  const onResetPassword = async () => {
    try {
      const result = await signIn!.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
        password: newPassword,
      });
      if (result.status === "complete") {
        await setLoginActive!({ session: result.createdSessionId });
        setMode("Login");
        handleSuccess(i18n.t("SignIn.messages.passwordReset"));
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.message || err.message || i18n.t("SignIn.messages.passwordResetFailed");
      ToastAndroid.show(message, 2);
    }
  };

  const renderCloseButton = () => (
    <TouchableOpacity onPress={onClose}>
      <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="black" width={24} height={24}>
        <Path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </Svg>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="none" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {mode === "Login" && (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.title}>{i18n.t("SignIn.SignIn")}</Text>
                {renderCloseButton()}
              </View>
              <Text>{i18n.t("SignIn.terms")}</Text>
              <SocialLoginButton strategy="google" onClose={onClose} onSuccess={onSuccess} />
              <SocialLoginButton strategy="facebook" onClose={onClose} onSuccess={onSuccess} />
              <TextInput
                placeholder={i18n.t("SignUp.Notification.Email")}
                value={emailAddress}
                onChangeText={setEmailAddress}
                style={styles.input}
                keyboardType="email-address"
              />
              <TextInput
                placeholder={i18n.t("SignIn.Password")}
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
              />
              <TouchableOpacity onPress={onSignInPress} style={styles.loginButton}>
                <Text style={styles.closeButtonText}>{i18n.t("SignIn.SignIn")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode("Reset Password")}>
                <Text style={[styles.switchText, { marginTop: 10 }]}>{i18n.t("SignIn.ForgotPassword")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode("Sign Up")}>
                <Text style={styles.switchText}>
                  {i18n.t("SignIn.NoAccount")} {" "}
                  <Text style={styles.linkText}>{i18n.t("SignIn.Create")}</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}

          {mode === "Sign Up" && (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.title}>{i18n.t("SignUp.Join Community")}</Text>
                {renderCloseButton()}
              </View>
              <Text>{i18n.t("SignIn.terms")}</Text>
              <SocialLoginButton strategy="google" onClose={onClose} onSuccess={onSuccess} />
              <SocialLoginButton strategy="facebook" onClose={onClose} onSuccess={onSuccess} />
              <TextInput
                placeholder={i18n.t("SignUp.Notification.Email")}
                style={styles.input}
                value={emailAddress}
                onChangeText={setEmailAddress}
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              <TextInput
                placeholder={i18n.t("SignIn.Username")}
                style={styles.input}
                value={username}
                onChangeText={setUsername}
              />
              {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
              <TextInput
                placeholder={i18n.t("SignIn.Password")}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              <TouchableOpacity onPress={onSignUpPress} style={styles.loginButton}>
                <Text style={styles.closeButtonText}>{i18n.t("NavBar.Signup")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode("Login")}>
                <Text style={styles.switchText}>
                  {i18n.t("SignUp.Already")}{" "}
                  <Text style={styles.linkText}>{i18n.t("SignIn.SignIn")}</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}

          {mode === "verification" && (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.title}>{i18n.t("SignUp.verifyTitle")}</Text>
                {renderCloseButton()}
              </View>
              <Text>{i18n.t("SignUp.verifyInstructions")}</Text>
              <TextInput
                placeholder={i18n.t("SignUp.verificationCode")}
                value={verificationCode}
                onChangeText={setVerificationCode}
                style={styles.input}
                keyboardType="number-pad"
              />
              <TouchableOpacity style={styles.loginButton} onPress={onVerifyPress}>
                <Text style={styles.closeButtonText}>{i18n.t("SignUp.Verify")}</Text>
              </TouchableOpacity>
            </>
          )}

          {mode === "Reset Password" && (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.title}>{i18n.t("SignIn.resetTitle")}</Text>
                {renderCloseButton()}
              </View>
              <Text>{i18n.t("SignIn.resetInstructions")}</Text>
              <TextInput
                placeholder={i18n.t("SignUp.Notification.Email")}
                style={styles.input}
                value={emailAddress}
                onChangeText={setEmailAddress}
              />
              <TouchableOpacity style={styles.loginButton} onPress={onSendResetEmail}>
                <Text style={styles.closeButtonText}>{i18n.t("SignIn.sendResetCode")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode("Login")}>
                <Text style={styles.switchText}>
                  {i18n.t("SignIn.backTo")} <Text style={styles.linkText}>{i18n.t("SignIn.SignIn")}</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}

          {mode === "Reset Verification" && (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.title}>{i18n.t("SignIn.resetCodeTitle")}</Text>
                {renderCloseButton()}
              </View>
              <Text>{i18n.t("SignIn.resetCodeInstructions")}</Text>
              <TextInput
                placeholder={i18n.t("SignIn.resetCode")}
                style={styles.input}
                value={resetCode}
                onChangeText={setResetCode}
                keyboardType="number-pad"
              />
              <TextInput
                placeholder={i18n.t("SignIn.newPassword")}
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <TouchableOpacity style={styles.loginButton} onPress={onResetPassword}>
                <Text style={styles.closeButtonText}>{i18n.t("SignIn.resetTitle")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode("Login")}>
                <Text style={styles.switchText}>
                  {i18n.t("SignIn.backTo")} <Text style={styles.linkText}>{i18n.t("SignIn.SignIn")}</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default AuthModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 30,
    elevation: 5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: { fontSize: 22, fontWeight: "bold" },
  input: {
    backgroundColor: "#f1f1f1",
    borderRadius: 25,
    padding: 12,
    marginTop: 10,
  },
  loginButton: {
    backgroundColor: "#166534",
    marginTop: 25,
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeButtonText: { color: "#fff", fontSize: 16 },
  errorText: { color: "red", fontSize: 12, marginLeft: 4 },
  switchText: { marginTop: 15, textAlign: "center" },
  linkText: { color: "#166534", fontWeight: "bold" },
});
