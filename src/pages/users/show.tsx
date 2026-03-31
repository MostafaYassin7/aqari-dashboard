import { useShow, useNavigation } from "@refinedev/core";
import {
  Card,
  Typography,
  Space,
  Avatar,
  Tag,
  Descriptions,
  Button,
  Row,
  Col,
  Spin,
  Divider,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  StarOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const ROLE_COLOR: Record<string, string> = {
  admin: "red",
  ADMIN: "red",
  owner: "blue",
  OWNER: "blue",
  broker: "purple",
  BROKER: "purple",
  user: "default",
  USER: "default",
  host: "cyan",
  HOST: "cyan",
};

export const UserShow: React.FC = () => {
  const { queryResult } = useShow({
    resource: "users",
    meta: { path: "/users" },
  });
  const { edit, list } = useNavigation();

  const { data, isLoading } = queryResult;
  const rawData = data?.data as Record<string, unknown>;
  const user = (rawData?.data as Record<string, unknown>) || rawData || {};

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => list("users")}>
          Back
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          User Profile
        </Title>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card>
            <Space direction="vertical" align="center" style={{ width: "100%" }}>
              <Avatar
                src={user.profilePhoto as string}
                icon={<UserOutlined />}
                size={80}
              />
              <Title level={5} style={{ margin: 0 }}>
                {(user.name as string) || "No Name"}
              </Title>
              <Text type="secondary">{user.phone as string}</Text>
              <Tag color={ROLE_COLOR[user.role as string] || "default"}>
                {(user.role as string)?.toUpperCase()}
              </Tag>
              {user.isActive === false && <Tag color="red">Deactivated</Tag>}
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => edit("users", user.id as string)}
                block
              >
                Edit User
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Profile Details">
            <Descriptions column={1} labelStyle={{ fontWeight: 600 }}>
              <Descriptions.Item label="ID">{user.id as string || "—"}</Descriptions.Item>
              <Descriptions.Item label="Name">{(user.name as string) || "—"}</Descriptions.Item>
              <Descriptions.Item label="Phone">{(user.phone as string) || "—"}</Descriptions.Item>
              <Descriptions.Item label="Email">{(user.email as string) || "—"}</Descriptions.Item>
              <Descriptions.Item label="Role">
                <Tag color={ROLE_COLOR[user.role as string] || "default"}>
                  {(user.role as string)?.toUpperCase() || "—"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Bio">{(user.bio as string) || "—"}</Descriptions.Item>
              <Descriptions.Item label="Joined">
                {user.createdAt
                  ? new Date(user.createdAt as string).toLocaleString()
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Updated">
                {user.updatedAt
                  ? new Date(user.updatedAt as string).toLocaleString()
                  : "—"}
              </Descriptions.Item>
            </Descriptions>

            {!!user.establishment && (
              <>
                <Divider />
                <Title level={5}>
                  <StarOutlined /> Establishment
                </Title>
                <Descriptions column={1}>
                  <Descriptions.Item label="Name">
                    {((user.establishment as Record<string, unknown>)?.name as string) || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Name (AR)">
                    {((user.establishment as Record<string, unknown>)?.nameAr as string) || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Commercial Record">
                    {((user.establishment as Record<string, unknown>)?.commercialRecord as string) || "—"}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
};
