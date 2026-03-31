import { useList, useNavigation } from "@refinedev/core";
import {
  Table,
  Space,
  Typography,
  Tag,
  Button,
  Select,
  Input,
  Row,
  Col,
  Tooltip,
  Card,
} from "antd";
import { EyeOutlined, SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import type { CrudFilter } from "@refinedev/core";

const { Title, Text } = Typography;

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Ready", value: "ready" },
  { label: "Off Plan", value: "off_plan" },
];

export const ProjectList: React.FC = () => {
  const { show, create } = useNavigation();
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filters: CrudFilter[] = [];
  if (statusFilter) filters.push({ field: "status", operator: "eq", value: statusFilter });
  if (cityFilter) filters.push({ field: "city", operator: "eq", value: cityFilter });

  const { data, isLoading } = useList({
    resource: "projects",
    pagination: { current: page, pageSize },
    filters,
  });

  const projects = (data?.data || []) as Array<Record<string, unknown>>;
  const total = data?.total || 0;

  const columns = [
    {
      title: "Project",
      key: "project",
      render: (_: unknown, record: Record<string, unknown>) => (
        <div>
          <Text strong>{(record.title as string) || `Project #${record.id}`}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.city as string} {record.district ? `· ${record.district}` : ""}
          </Text>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "ready" ? "green" : "blue"}>
          {status?.replace("_", " ").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Price Range",
      key: "price",
      render: (_: unknown, record: Record<string, unknown>) => {
        if (record.priceFrom || record.priceTo) {
          return (
            <Text>
              SAR {Number(record.priceFrom || 0).toLocaleString()} –{" "}
              {Number(record.priceTo || 0).toLocaleString()}
            </Text>
          );
        }
        return <Text type="secondary">—</Text>;
      },
    },
    {
      title: "Units",
      key: "units",
      render: (_: unknown, record: Record<string, unknown>) => {
        return <Text>{(record.totalUnits as number) ?? 0}</Text>;
      },
    },
    {
      title: "Delivery",
      dataIndex: "deliveryDate",
      key: "deliveryDate",
      render: (v: string) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    {
      title: "Owner",
      key: "owner",
      render: (_: unknown, record: Record<string, unknown>) => {
        const owner = record.owner as Record<string, unknown>;
        return owner ? (
          <Text>{(owner.name as string) || owner.phone as string || "—"}</Text>
        ) : (
          <Text type="secondary">—</Text>
        );
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Record<string, unknown>) => (
        <Tooltip title="View / Manage Units">
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => show("projects", record.id as string)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row justify="space-between" align="middle">
        <Title level={4} style={{ margin: 0 }}>Projects</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create("projects")}>
          New Project
        </Button>
      </Row>

      <Card>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8}>
            <Select
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={STATUS_OPTIONS}
              style={{ width: "100%" }}
              placeholder="Filter by status"
            />
          </Col>
          <Col xs={24} sm={8}>
            <Input
              value={cityFilter}
              onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
              placeholder="Filter by city"
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      <Table
        dataSource={projects}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total,
          showTotal: (t) => `${t} projects`,
          onChange: setPage,
        }}
        scroll={{ x: 800 }}
      />
    </Space>
  );
};
