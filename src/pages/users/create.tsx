import { useState } from "react";
import { useNotification } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Space,
  Typography,
  Steps,
  Alert,
  Result,
} from "antd";
import {
  ArrowLeftOutlined,
  SendOutlined,
  PhoneOutlined,
  LockOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "../../dataProvider";
import { API_URL } from "../../config";

const { Title, Text } = Typography;
const { Step } = Steps;

const ROLES = [
  { label: "User", value: "USER" },
  { label: "Owner", value: "OWNER" },
  { label: "Broker", value: "BROKER" },
  { label: "Host", value: "HOST" },
  { label: "Admin", value: "ADMIN" },
];

export const UserCreate: React.FC = () => {
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState("");
  const [newUserToken, setNewUserToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { open } = useNotification();
  const navigate = useNavigate();

  // Step 0: Send OTP
  const handleSendOtp = async (values: { phone: string }) => {
    let p = values.phone.trim();
    if (!p.startsWith("+")) p = `+966${p.replace(/^0/, "")}`;
    setPhone(p);
    setLoading(true);
    try {
      await axiosInstance.post("/auth/send-otp", { phone: p });
      open?.({ type: "success", message: `OTP sent to ${p}` });
      setStep(1);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      open?.({
        type: "error",
        message: error?.response?.data?.message || "Failed to send OTP",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Verify OTP — gets a token for the NEW user
  const handleVerifyOtp = async (values: { code: string }) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post("/auth/verify-otp", {
        phone,
        code: values.code.trim(),
      });
      const token =
        (data?.data as Record<string, string>)?.token ||
        (data as Record<string, string>)?.token ||
        (data as Record<string, string>)?.access_token;
      if (!token) throw new Error("No token received");
      // Store in local state ONLY — never overwrite the admin's token
      setNewUserToken(token);
      setStep(2);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      open?.({
        type: "error",
        message: error?.response?.data?.message || "Invalid OTP",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Complete profile for the new user using their own token
  const handleCompleteProfile = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      await axiosInstance.post(
        "/auth/complete-profile",
        {
          name: values.name,
          email: values.email || undefined,
          role: values.role,
        },
        { headers: { Authorization: `Bearer ${newUserToken}` } }
      );
      open?.({ type: "success", message: "User created successfully" });
      setDone(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      open?.({
        type: "error",
        message: error?.response?.data?.message || "Failed to complete profile",
      });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Result
        status="success"
        title="User Created"
        subTitle={`Account for ${phone} has been created and profile completed.`}
        extra={[
          <Button type="primary" key="users" onClick={() => navigate("/users")}>
            Back to Users
          </Button>,
          <Button key="another" onClick={() => { setStep(0); setDone(false); setPhone(""); setNewUserToken(""); }}>
            Create Another
          </Button>,
        ]}
      />
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/users")}>
          Back
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          Create User
        </Title>
      </Space>

      <Alert
        type="info"
        showIcon
        message="OTP-Based User Creation"
        description={
          <span>
            Since authentication is OTP-only, creating a user requires completing the
            full OTP flow on their behalf. For a better admin experience, implement{" "}
            <Text code>POST /admin/users</Text> on the backend.
          </span>
        }
      />

      <Card style={{ maxWidth: 520 }}>
        <Steps current={step} style={{ marginBottom: 32 }}>
          <Step title="Phone" icon={<PhoneOutlined />} />
          <Step title="Verify OTP" icon={<LockOutlined />} />
          <Step title="Profile" icon={<UserOutlined />} />
        </Steps>

        {step === 0 && (
          <Form layout="vertical" size="large" onFinish={handleSendOtp}>
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[{ required: true }]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="+966500000000"
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Send OTP
            </Button>
          </Form>
        )}

        {step === 1 && (
          <Form layout="vertical" size="large" onFinish={handleVerifyOtp}>
            <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
              Enter the OTP sent to <Text strong>{phone}</Text>
            </Text>
            <Form.Item
              name="code"
              label="OTP Code"
              rules={[{ required: true }, { len: 6, message: "Must be 6 digits" }]}
            >
              <Input
                prefix={<LockOutlined />}
                placeholder="6-digit code"
                maxLength={6}
                style={{ letterSpacing: 8, textAlign: "center" }}
              />
            </Form.Item>
            <Space style={{ width: "100%" }} direction="vertical">
              <Button type="primary" htmlType="submit" block loading={loading}>
                Verify OTP
              </Button>
              <Button block onClick={() => setStep(0)}>
                Back
              </Button>
            </Space>
          </Form>
        )}

        {step === 2 && (
          <Form layout="vertical" size="large" onFinish={handleCompleteProfile}>
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true }]}
            >
              <Input placeholder="Ahmed Al-Rashid" />
            </Form.Item>
            <Form.Item name="email" label="Email (optional)">
              <Input type="email" placeholder="user@example.com" />
            </Form.Item>
            <Form.Item name="role" label="Role" rules={[{ required: true }]}>
              <Select options={ROLES} />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              icon={<SendOutlined />}
              loading={loading}
            >
              Create User
            </Button>
          </Form>
        )}
      </Card>
    </Space>
  );
};
