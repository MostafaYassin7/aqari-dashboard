import { useState } from "react";
import { useLogin, useNavigation } from "@refinedev/core";
import { Card, Form, Input, Button, Typography, Space, Alert } from "antd";
import { PhoneOutlined, HomeOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate: login } = useLogin();
  const { push } = useNavigation();

  const handleSubmit = async (values: { phone: string }) => {
    setLoading(true);
    setError(null);
    // Format phone: ensure +966 prefix
    let phone = values.phone.trim();
    if (!phone.startsWith("+")) {
      phone = `+966${phone.replace(/^0/, "")}`;
    }
    login(
      { phone },
      {
        onSuccess: (data) => {
          setLoading(false);
          if (data?.success && data?.redirectTo) {
            push(data.redirectTo as string);
          } else if (!data?.success) {
            setError((data?.error as { message?: string })?.message || "Failed to send OTP");
          }
        },
        onError: (err: unknown) => {
          setLoading(false);
          setError((err as { message?: string })?.message || "Failed to send OTP");
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
              Aqar Admin
            </Title>
            <Text type="secondary">Enter your phone number to continue</Text>
          </div>

          {error && (
            <Alert type="error" message={error} showIcon closable onClose={() => setError(null)} />
          )}

          <Form layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                { required: true, message: "Please enter your phone number" },
                {
                  pattern: /^(\+966|0)?5\d{8}$/,
                  message: "Enter a valid Saudi phone number (e.g. 0500000000)",
                },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="+966500000000"
                size="large"
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
              Send OTP
            </Button>
          </Form>
        </Space>
      </Card>
    </div>
  );
};
