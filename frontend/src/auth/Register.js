import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";
import CustomSelect from "../components/CustomSelect";
import "./Login.css";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [roleId, setRoleId] = useState(1);
  const [roles, setRoles] = useState([]);
  const [secretKey, setSecretKey] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState(null);
  const [type, setType] = useState("");

  useEffect(() => {
    api.get("/users/roles")
      .then((res) => {
        const available = (res.data || []).filter(r => ["Student", "Teacher", "Admin"].includes(r.role_name));
        const sorted = available.sort((a, b) => Number(a.role_id) - Number(b.role_id));
        setRoles(sorted);
        if (sorted.length > 0) setRoleId(sorted[0].role_id);
      })
      .catch(() => {
        const fallback = [
          { role_id: 1, role_name: "Student" },
          { role_id: 2, role_name: "Teacher" }
        ];
        setRoles(fallback);
        setRoleId(1);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const selectedRole = roles.find(r => r.role_id === roleId);

    const fields = [
      { name: "Full Name", value: name },
      { name: "Email", value: email },
      { name: "Password", value: password },
    ];

    fields.push({ name: "Department", value: department });

    if (selectedRole?.role_name === "Student") {
      fields.push({ name: "Year", value: year });
    }

    const emptyFields = fields.filter(f => !f.value);

    if (emptyFields.length === 1) {
      const msg = `${emptyFields[0].name} is required`;
      setType("error");
      toast.error(msg);
      return setMessage(msg);
    }

    if (emptyFields.length > 1) {
      const msg = "All fields are required";
      setType("error");
      toast.error(msg);
      return setMessage(msg);
    }

    /* 1. NAME VALIDATION */
    const nameRegex = /^[a-zA-Z\s.']{2,50}$/;
    if (!nameRegex.test(name.trim())) {
      const msg = "Name must only contain letters and spaces (2-50 characters)";
      setType("error");
      toast.error(msg);
      return setMessage(msg);
    }

    /* 2. EMAIL STRICT VALIDATION */
    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9]+([._%+-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailTrimmed)) {
      const msg = "Please enter a valid email address";
      setType("error");
      toast.error(msg);
      return setMessage(msg);
    }

    /* 3. PASSWORD VALIDATION */
    if (password.length < 8) {
      const msg = "Password must be at least 8 characters long";
      setType("error");
      toast.error(msg);
      return setMessage(msg);
    }

    if (selectedRole?.role_name === "Admin" && !secretKey) {
      const msg = "Admin role requires the System Admin Authorization Key";
      setType("error");
      toast.error(msg);
      return setMessage(msg);
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
        department,
        year: showYear ? year : null,
        role_id: roleId,
        secret_key: secretKey
      });

      setType("success");
      setMessage("Registration successful! Logging you in...");
      toast.success("Account created successfully! 🎉");

      if (res.data.token && res.data.user) {
        localStorage.setItem("token", res.data.token);
        if (res.data.refreshToken) {
          localStorage.setItem("refreshToken", res.data.refreshToken);
        }
        localStorage.setItem("user", JSON.stringify(res.data.user));
        window.dispatchEvent(new Event("authChange"));
      }

      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Registration failed";
      setType("error");
      setMessage(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const currentRoleName = roles.find(r => r.role_id === roleId)?.role_name;
  const showYear = currentRoleName === "Student";
  const requiresKey = currentRoleName === "Admin";

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h2>Sign Up</h2>

        {message && (
          <div className={`auth-message ${type}`}>
            {message}
          </div>
        )}

        <CustomSelect
          value={roleId}
          onChange={(val) => setRoleId(Number(val))}
          options={roles.map((r) => ({
            value: r.role_id,
            label: r.role_name === "Student" ? "🎓 Student" : r.role_name === "Teacher" ? "👨‍🏫 Teacher / Faculty" : "🛡️ Admin"
          }))}
          placeholder="Select Role"
        />

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="password-input-wrap">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        <CustomSelect
          value={department}
          onChange={(val) => setDepartment(val)}
          options={[
            { value: "CS", label: "CS (Computer Science)" },
            { value: "IT", label: "IT (Information Technology)" },
            { value: "AIDS", label: "AIDS (AI & Data Science)" },
            { value: "ECE", label: "ECE (Electronics & Communication)" },
            { value: "ENTC", label: "ENTC (Electronics & Telecommunication)" }
          ]}
          placeholder="Select Department"
        />

        {showYear && (
          <CustomSelect
            value={year}
            onChange={(val) => setYear(val)}
            options={[
              { value: "1", label: "FE (First Year)" },
              { value: "2", label: "SE (Second Year)" },
              { value: "3", label: "TE (Third Year)" },
              { value: "4", label: "BE (Final / Fourth Year)" }
            ]}
            placeholder="Select Year"
          />
        )}

        {requiresKey && (
          <div className="password-input-wrap">
            <input
              type={showSecretKey ? "text" : "password"}
              placeholder="Enter System Admin Secret Key"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowSecretKey(!showSecretKey)}
              title={showSecretKey ? "Hide secret key" : "Show secret key"}
            >
              {showSecretKey ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
