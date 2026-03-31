import { useState } from "react";
import axios from "axios";
import { useNavigation, useNotification, useList } from "@refinedev/core";
import {
  Card,
  Input,
  Button,
  Table,
  Space,
  Typography,
  Avatar,
  Tag,
  Tooltip,
  Alert,
  Row,
  Col,
  Select,
  Divider,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { API_URL } from "../../config";
import { TableSkeleton } from "../../components/common/TableSkeleton";
import { useExportCsv } from "../../hooks/useExportCsv";

const { Title, Text } = Typography;

const ROLE_COLOR: Record<string, string> = {
  admin: "red", ADMIN: "red",
  owner: "blue", OWNER: "blue",
  broker: "purple", BROKER: "purple",
  user: "default", USER: "default",
  host: "cyan", HOST: "cyan",
};

export const UserList: React.FC = () => {
  const { show, edit, create } = useNavigation();
  const { open } = useNotification();
  const exportCsv = useExportCsv();

  // Search by ID fallback
  const [userId, setUserId] = useState("");
  const [singleUser, setSingleUser] = useState<Record<string, unknown> | null>(null);
  const [searching, setSearching] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Attempt to load all users (requires GET /users admin endpoint)
  const { data: usersData, isLoading } = useList({
    resource: "users",
    pagination: { current: page, pageSize },
    queryOptions: { retry: false },
  });

  const users = (usersData?.data || []) as Array<Record<string, unknown>>;
  const total = usersData?.total || 0;
  const hasListEndpoint = users.length > 0;

  const handleSearchById = async () => {
    if (!userId.trim()) return;
    setSearching(true);
    try {
      const { data } = await axios.get(`${API_URL}/users/${userId.trim()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("aqar_admin_token")}` },
      });
      const user = (data?.data as Record<string, unknown>) || data;
      setSingleUser(user);
    } catch {
      open?.({ type: "error", message: "User not found" });
      setSingleUser(null);
    } finally {
      setSearching(false);
    }
  };

  const handleExport = () => {
    const source = hasListEndpoint ? users : singleUser ? [singleUser] : [];
    exportCsv(
      "users.csv",
      ["ID", "Name", "Phone", "Email", "Role", "Active", "Joined"],
      source.map((u) => [
        u.id as string, u.name as string, u.phone as string,
        u.email as string, u.role as string,
        u.isActive !== false ? "Yes" : "No",
        u.createdAt ? new Date(u.createdAt as string).toLocaleDateString() : "",
      ])
    );
  };

  const columns = [
    {
      title: "User",
      key: "user",
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Avatar
            src={record.profilePhoto as string}
            icon={<UserOutlined />}
            size={40}
          />
          <div>
            <Text strong style={{ fontSize: 13 }}>
              {(record.name as string) || "—"}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.phone as string}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={ROLE_COLOR[role] || "default"}>{role?.toUpperCase() || "—"}</Tag>
      ),
    },
    {
      title: "Subscription",
      key: "subscription",
      render: (_: unknown, record: Record<string, unknown>) => {
        const sub = record.subscription as Record<string, unknown>;
        if (sub?.plan) {
          return <Tag color="purple">{sub.plan as string}</Tag>;
        }
        return <Tag>Free</Tag>;
      },
    },
    {
      title: "Listings",
      dataIndex: "listingCount",
      key: "listingCount",
      render: (v: number) => v ?? <Text type="secondary">—</Text>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (v: boolean) =>
        v === false ? <Tag color="red">Deactivated</Tag> : <Tag color="green">Active</Tag>,
    },
    {
      title: "Joined",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Tooltip title="View">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => show("users", record.id as string)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => edit("users", record.id as string)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row justify="space-between" align="middle">
        <Title level={4} style={{ margin: 0 }}>Users</Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Export CSV
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => create("users")}>
            Add User
          </Button>
        </Space>
      </Row>

      {!hasListEndpoint && !isLoading && (
        <Alert
          type="warning"
          showIcon
          message="Backend Missing: GET /users List Endpoint"
          description="A GET /api/v1/admin/users endpoint is required to list all users. The table below is ready for it. Use the search below to look up individual users in the meantime."
        />
      )}

      {/* Paginated table if the endpoint exists */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : hasListEndpoint ? (
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (t) => `${t} users`,
            onChange: setPage,
          }}
          scroll={{ x: 800 }}
        />
      ) : (
        /* Fallback: search by ID */
        <Card title="Search User by ID">
          <Row gutter={12} align="middle">
            <Col flex="auto">
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter User ID"
                prefix={<SearchOutlined />}
                onPressEnter={handleSearchById}
                size="large"
              />
            </Col>
            <Col>
              <Button
                type="primary"
                size="large"
                loading={searching}
                onClick={handleSearchById}
              >
                Search
              </Button>
            </Col>
          </Row>

          {singleUser && (
            <div style={{ marginTop: 16 }}>
              <Divider />
              <Table
                dataSource={[singleUser]}
                columns={columns}
                rowKey="id"
                pagination={false}
              />
            </div>
          )}
        </Card>
      )}

      {/* Phone search (always visible) */}
      <Card
        title="Search by Phone / Ad Number"
        size="small"
        style={{ background: "#fafafa" }}
      >
        <Row gutter={12} align="middle">
          <Col xs={24} sm={16}>
            <Input
              placeholder="e.g. +966500000000 or AQ-SEED001"
              prefix={<SearchOutlined />}
              onPressEnter={async (e) => {
                const q = (e.target as HTMLInputElement).value.trim();
                if (!q) return;
                try {
                  const { data } = await axios.get(`${API_URL}/search/by-reference`, {
                    params: { q },
                    headers: { Authorization: `Bearer ${localStorage.getItem("aqar_admin_token")}` },
                  });
                  const items =
                    (data?.data?.data as unknown[]) ||
                    (data?.data as unknown[]) ||
                    [];
                  open?.({
                    type: items.length > 0 ? "success" : "error",
                    message: items.length > 0 ? `Found ${items.length} result(s)` : "No results found",
                  });
                } catch {
                  open?.({ type: "error", message: "Search failed" });
                }
              }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Results appear in the global header search bar
            </Text>
          </Col>
        </Row>
      </Card>
    </Space>
  );
};
