import { useOAuth, useSignIn, useSignUp, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
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
}

const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
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
  const router = useRouter();

  const onSignInPress = async () => {
    if (!loginLoaded) return;

    try {
      const signInAttempt = await signIn!.create({
        identifier: emailAddress,
        password,
      });

      console.log(signInAttempt)
      if (signInAttempt.status === "complete") {
        await setLoginActive({ session: signInAttempt.createdSessionId });
        await user?.reload();
        onClose();
        ToastAndroid.show("Logged in successfully", 2);
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.message || err.message || "Login failed";
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
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        ToastAndroid.show("Verification code sent to your email.", 2);
        setMode("verification");
      } else if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        await user?.reload();
        onClose();
        ToastAndroid.show("Signed up successfully", 2);
      }
    } catch (err: any) {
      const errors = err?.errors || [];
      errors.forEach((e: any) => {
        if (e.meta?.paramName === "email_address") {
          setEmailError(e.message);
        } else if (e.meta?.paramName === "username") {
          setUsernameError(e.message);
        } else if (e.meta?.paramName === "password") {
          setPasswordError(e.message);
        }
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
        ToastAndroid.show("Email verified successfully", 2);
        onClose();
        setMode("Login");
      }
    } catch {
      ToastAndroid.show("Invalid or expired code.", 2);
    }
  };

  const renderCloseButton = () => (
    <TouchableOpacity onPress={onClose}>
      <Svg
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="black"
        width={24}
        height={24}
      >
        <Path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </Svg>
    </TouchableOpacity>
  );

  const onSendResetEmail = async () => {
    try {
      await signIn!.create({
        strategy: "reset_password_email_code",
        identifier: emailAddress,
      });
      ToastAndroid.show("Reset code sent to your email", 2);
      setMode("Reset Verification");
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.message ||
        err.message ||
        "Failed to send reset email";
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
        ToastAndroid.show("Password reset successfully", 2);
        onClose();
        setMode("Login");
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.message || err.message || "Password reset failed";
      ToastAndroid.show(message, 2);
    }
  };

  return (
    <Modal visible={visible} animationType="none" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {mode === "Login" && (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Login</Text>
                {renderCloseButton()}
              </View>
              <Text>
                By continuing, you agree to our Terms and Privacy Policy.
              </Text>
              <SocialLoginButton strategy="google" onClose={onClose} />
              <SocialLoginButton strategy="facebook" onClose={onClose} />
              <TextInput
                placeholder="Email"
                value={emailAddress}
                onChangeText={setEmailAddress}
                style={styles.input}
                keyboardType="email-address"
              />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
              />
              <TouchableOpacity
                onPress={onSignInPress}
                style={styles.loginButton}
              >
                <Text style={styles.closeButtonText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode("Reset Password")}>
                <Text style={[styles.switchText, { marginTop: 10 }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setMode("Sign Up")}>
                <Text style={styles.switchText}>
                  Don’t have an account?{" "}
                  <Text style={styles.linkText}>Join SportyExpats</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}

          {mode === "Sign Up" && (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Join Community</Text>
                {renderCloseButton()}
              </View>
              <Text>
                By continuing, you agree to our Terms and Privacy Policy.
              </Text>
              <SocialLoginButton strategy="google" onClose={onClose} />
              <SocialLoginButton strategy="facebook" onClose={onClose} />
              <TextInput
                placeholder="Email"
                style={styles.input}
                value={emailAddress}
                onChangeText={setEmailAddress}
              />
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}

              <TextInput
                placeholder="Username"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
              />
              {usernameError ? (
                <Text style={styles.errorText}>{usernameError}</Text>
              ) : null}

              <TextInput
                placeholder="Password"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}

              <TouchableOpacity
                onPress={onSignUpPress}
                style={styles.loginButton}
              >
                <Text style={styles.closeButtonText}>Sign up</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setMode("Login")}>
                <Text style={styles.switchText}>
                  Already have an account?{" "}
                  <Text style={styles.linkText}>Login</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}

          {mode === "verification" && (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Verify Your Email</Text>
                {renderCloseButton()}
              </View>
              <Text>Please enter the 6-digit code sent to your email.</Text>
              <TextInput
                placeholder="Verification Code"
                value={verificationCode}
                onChangeText={setVerificationCode}
                style={styles.input}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.loginButton}
                onPress={onVerifyPress}
              >
                <Text style={styles.closeButtonText}>Verify</Text>
              </TouchableOpacity>
            </>
          )}

          {mode === "Reset Password" && (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Reset Password</Text>
                {renderCloseButton()}
              </View>
              <Text>Enter your email address to receive a reset code.</Text>
              <TextInput
                placeholder="Email"
                style={styles.input}
                value={emailAddress}
                onChangeText={setEmailAddress}
              />
              <TouchableOpacity
                style={styles.loginButton}
                onPress={onSendResetEmail}
              >
                <Text style={styles.closeButtonText}>Send Reset Code</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode("Login")}>
                <Text style={styles.switchText}>
                  Back to <Text style={styles.linkText}>Login</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
          {mode === "Reset Verification" && (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Enter Reset Code</Text>
                {renderCloseButton()}
              </View>
              <Text>Check your email for the 6-digit code.</Text>
              <TextInput
                placeholder="Reset Code"
                style={styles.input}
                value={resetCode}
                onChangeText={setResetCode}
                keyboardType="number-pad"
              />
              <TextInput
                placeholder="New Password"
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <TouchableOpacity
                style={styles.loginButton}
                onPress={onResetPassword}
              >
                <Text style={styles.closeButtonText}>Reset Password</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode("Login")}>
                <Text style={styles.switchText}>
                  Back to <Text style={styles.linkText}>Login</Text>
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
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
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
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginLeft: 4,
  },
  switchText: {
    marginTop: 15,
    textAlign: "center",
  },
  linkText: {
    color: "#166534",
    fontWeight: "bold",
  },
});
