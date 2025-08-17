import Header from "../../layout/HeaderComp";
import EmailInputField from "../../../src/components/InputFieldComp";
import PasswordInput from "../../../src/components/InputFieldwEyeComp";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function AdminLogin() {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState({
    adminEmail: "",
    adminPassword: "",
    adminGeneral: "",
  });

  //height vh fit
  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setViewportHeight();
    window.addEventListener("resize", setViewportHeight);

    return () => {
      window.removeEventListener("resize", setViewportHeight);
    };
  }, []);

  // dummy valid user credentials
  const validAdminEmail = "admin";
  const validAdminPassword = "admin";

  const navigate = useNavigate(); // Initialize the navigate function

  //error handling here
  const handleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const newError = { adminEmail: "", adminPassword: "", adminGeneral: "" };
    const trimmedAdminEmail = adminEmail.trim();
    const trimmedAdminPassword = adminPassword.trim();

    //check of empty inputs
    if (!trimmedAdminEmail) newError.adminEmail = "Email is required";
    if (!trimmedAdminPassword) newError.adminPassword = "Password is required";

    // e check niya if tinood ba na walay inputs ang email og password
    const hasEmptyFields = !trimmedAdminEmail || !trimmedAdminPassword;

    // dari na dayun tong mga error handling based kung unsay sulod sa input fields
    // error para sa email and password formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!hasEmptyFields) {
      if (!emailRegex.test(trimmedAdminEmail))
        newError.adminEmail = "Invalid email format";

      if (trimmedAdminPassword.length < 1)
        newError.adminPassword = "Password must be at least 8 characters";
    }

    const noInputErrors = !newError.adminEmail && !newError.adminPassword;

    if (noInputErrors) {
      const isEmailValid = trimmedAdminEmail === validAdminEmail;
      const isPasswordValid = trimmedAdminPassword === validAdminPassword;

      if (!isEmailValid || !isPasswordValid)
        newError.adminGeneral = "Invalid email or password";
    }

    // gamiton ang mga errors
    setAdminError(newError);

    const isValid =
      !newError.adminEmail && !newError.adminPassword && !newError.adminGeneral;
    if (isValid) navigate("/home");
  };

  //error and no error styling
  const inputClass = (hasError: string) =>
    `w-full p-2.5 rounded-lg border ${
      hasError
        ? "border-red-500 ring-1 ring-red-400"
        : "border-gray-300 focus:ring-1 focus:ring-black"
    } focus:outline-none`;

  return (
    <>
      <div className="h-screen-fix flex flex-col p-5">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center font-manrope">
          <div className="w-full max-w-sm px-4 space-y-3">
            <h1 className="text-lg text-brand font-bold text-center">
              Admin Login
            </h1>
            <h1 className="text-3xl text-black font-bold text-center">
              Log in your account
            </h1>
            <p className="text-sm text-gray-600 text-center">
              Welcome back, it’s good to see you again
            </p>

            {/* Email and password fields */}
            <div>
              {/* Email InputField*/}
              <div className="mt-5">
                <EmailInputField
                  label="Email"
                  placeholder="Enter email"
                  value={adminEmail}
                  error={adminError.adminEmail || adminError.adminGeneral} // still passes the style error
                  showErrorText={!!adminError.adminEmail} // only shows text if email-specific error exists
                  inputClass={inputClass}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setAdminEmail(e.target.value);
                    setAdminError((prev) => ({
                      ...prev,
                      email: "",
                      general: "",
                    }));
                  }}
                />
              </div>

              {/* Password */}
              <PasswordInput
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setAdminError((prev) => ({
                    ...prev,
                    password: "",
                    general: "",
                  }));
                }}
                error={adminError.adminPassword}
                hasGeneralError={!!adminError.adminGeneral}
              />
            </div>

            {/* General error */}
            {adminError.adminGeneral && (
              <p className="text-xs text-red-500 text-center mt-3">
                {adminError.adminGeneral}
              </p>
            )}

            <div className="space-y-4 mt-8">
              {/* submit button */}
              <button
                onClick={handleLogin}
                className="bg-brand w-full py-2 text-white rounded-lg hover:bg-teal-600 hover:cursor-pointer transition-all duration-200"
                type="submit"
              >
                Login
              </button>

              <Link
                to="/login"
                className="block w-full border text-center text-brand hover:text-teal-600 hover:border-teal-600 py-2 border-brand rounded-lg"
              >
                Login as user
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
