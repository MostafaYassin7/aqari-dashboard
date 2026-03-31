import { useForm, useShow, useNavigation, useCustomMutation, useNotification } from "@refinedev/core";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Switch,
  Alert,
  Divider,
  Row,
  Col,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { API_URL } from "../../config";
import { axiosInstance } from "../../dataProvider";

const { Title, Text } = Typography;

const ROLES = ["USER", "OWNER", "BROKER", "HOST", "ADMIN"];

export const UserEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { list } = useNavigation();
  const { open } = useNotification();

  const { queryResult } = useShow({
    resource: "users",
    id,
    meta: { path: "/users" },
  });

  const rawData = queryResult?.data?.data as Record<string, unknown>;
  const user = (rawData?.data as Record<string, unknown>) || rawData || {};

  const [form] = Form.useForm();

  // Note: PATCH /users/profile only updates the authenticated user's profile.
  // For admin to update another user, a dedicated admin endpoint is needed.
  const handleSave = async (values: Record<string, unknown>) => {
    try {
      await axiosInstance.patch(`/users/profile`, {
        name: values.name,
        email: values.email,
        bio: values.bio,
      });
      open?.({ type: "success", message: "Profile updated" });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      open?.({
        type: "error",
        message: error?.response?.data?.message || "Update failed",
      });
    }
  };

  const handleDeactivate = async () => {
    open?.({
      type: "error",
      message: "Backend missing endpoint",
      description: "PATCH /admin/users/:id/deactivate is required on the backend",
    });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => list("users")}>
          Back
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          Edit User
        </Title>
      </Space>

      <Alert
        type="warning"
        showIcon
        message="Limited Admin Update Capability"
        description={
          <>
            <Text>
              The current backend only supports self-profile updates via{" "}
              <code>PATCH /users/profile</code>. To allow admins to update other
              users' roles or deactivate accounts, implement{" "}
              <code>PATCH /admin/users/:id</code> on the backend.
            </Text>
          </>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title={`Edit User: ${(user.name as string) || id}`}>
            <Form
              form={form}
              layout="vertical"
              initialValues={user}
              onFinish={handleSave}
            >
              <Form.Item name="name" label="Name">
                <Input />
              </Form.Item>
              <Form.Item name="email" label="Email">
                <Input type="email" />
              </Form.Item>
              <Form.Item name="bio" label="Bio">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item name="role" label="Role">
                <Select>
                  {ROLES.map((r) => (
                    <Select.Option key={r} value={r}>
                      {r}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Save Changes
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Account Status">
            <Space direction="vertical" style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text>Account Active</Text>
                <Switch
                  defaultChecked={user.isActive !== false}
                  onChange={(checked) => {
                    if (!checked) handleDeactivate();
                  }}
                />
              </div>
              <Divider />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Toggling deactivation requires a backend admin endpoint.
              </Text>
              <Button danger block onClick={handleDeactivate}>
                Deactivate Account
              </Button>
            </Space>
          </Card>

          <Card title="User Info" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: "100%", fontSize: 13 }}>
              <div>
                <Text type="secondary">Phone: </Text>
                <Text>{user.phone as string || "—"}</Text>
              </div>
              <div>
                <Text type="secondary">Role: </Text>
                <Text>{(user.role as string)?.toUpperCase() || "—"}</Text>
              </div>
              <div>
                <Text type="secondary">Joined: </Text>
                <Text>{user.createdAt ? new Date(user.createdAt as string).toLocaleDateString() : "—"}</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
};
