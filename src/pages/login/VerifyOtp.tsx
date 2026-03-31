import { useState } from "react";
import { useLogin, useNavigation } from "@refinedev/core";
import { Card, Form, Input, Button, Typography, Space, Alert } from "antd";
import { LockOutlined, HomeOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export const VerifyOtpPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate: login } = useLogin();
  const { push } = useNavigation(); // used for "Back to Login" button

  const params = new URLSearchParams(window.location.search);
  const phone = params.get("phone") || localStorage.getItem("aqar_admin_phone") || "";

  const handleSubmit = async (values: { code: string }) => {
    setLoading(true);
    setError(null);
    login(
      { phone, code: values.code.trim() },
      {
        onSuccess: (data) => {
          setLoading(false);
          if (!data.success) {
            setError("Authentication failed");
          }
          // Refine handles the redirect automatically via authProvider.login's redirectTo
        },
        onError: (err) => {
          setLoading(false);
          setError(err?.message || "Invalid OTP code");
        },
      }
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Card
        style={{
          width: 380,
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <HomeOutlined style={{ fontSize: 40, color: "#1677ff" }} />
            <Title level={3} style={{ marginTop: 8, marginBottom: 4 }}>
              Verify OTP
            </Title>
            <Text type="secondary">
              Enter the OTP sent to{" "}
              <Text strong>{phone}</Text>
            </Text>
          </div>

          {error && (
            <Alert type="error" message={error} showIcon closable onClose={() => setError(null)} />
          )}

          <Form layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="code"
              label="OTP Code"
              rules={[
                { required: true, message: "Please enter the OTP code" },
                { len: 6, message: "OTP code must be 6 digits" },
              ]}
            >
              <Input
                prefix={<LockOutlined />}
                placeholder="Enter 6-digit code"
                maxLength={6}
                size="large"
                style={{ letterSpacing: 8, textAlign: "center" }}
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              style={{ marginTop: 8 }}
            >
              Verify & Login
            </Button>
            <Button
              type="link"
              block
              style={{ marginTop: 8 }}
              onClick={() => push("/login")}
            >
              Back to Login
            </Button>
          </Form>
        </Space>
      </Card>
    </div>
  );
};
