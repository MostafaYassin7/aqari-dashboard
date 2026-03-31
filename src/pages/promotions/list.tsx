import { useList, useCustomMutation, useNotification, useInvalidate } from "@refinedev/core";
import {
  Table,
  Space,
  Typography,
  Tag,
  Button,
  Card,
  Popconfirm,
  Tooltip,
  Alert,
} from "antd";
import { StopOutlined, RocketOutlined } from "@ant-design/icons";
import { API_URL } from "../../config";

const { Title, Text } = Typography;

export const PromotionList: React.FC = () => {
  const { open } = useNotification();
  const invalidate = useInvalidate();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useList({
    resource: "promotions",
    meta: { path: "/promotions/my" },
    pagination: { current: page, pageSize },
  });

  const { mutate: cancelPromotion, isLoading: cancelling } = useCustomMutation();

  const promotions = (data?.data || []) as Array<Record<string, unknown>>;
  const total = data?.total || 0;

  const handleCancel = (id: string) => {
    cancelPromotion(
      { url: `${API_URL}/promotions/${id}/cancel`, method: "patch", values: {} },
      {
        onSuccess: () => {
          open?.({ type: "success", message: "Promotion cancelled" });
          invalidate({ resource: "promotions", invalidates: ["list"] });
        },
        onError: (err) =>
          open?.({ type: "error", message: err?.message || "Failed to cancel" }),
      }
    );
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Listing",
      key: "listing",
      render: (_: unknown, record: Record<string, unknown>) => {
        const listing = record.listing as Record<string, unknown>;
        return listing ? (
          <Space direction="vertical" size={0}>
            <Text strong>{(listing.title as string) || `Listing #${listing.id}`}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {listing.city as string}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        );
      },
    },
    {
      title: "Type",
      key: "type",
      render: (_: unknown, record: Record<string, unknown>) => {
        const type = record.promotionType as Record<string, unknown>;
        return type ? (
          <Tag color="blue">{(type.name as string) || "—"}</Tag>
        ) : (
          <Text type="secondary">—</Text>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: string) => {
        const color = v === "active" ? "green" : v === "cancelled" ? "red" : "default";
        return <Tag color={color}>{v?.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Starts",
      dataIndex: "startDate",
      key: "startDate",
      render: (v: string) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    {
      title: "Expires",
      dataIndex: "endDate",
      key: "endDate",
      render: (v: string) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Record<string, unknown>) => {
        if (record.status !== "active") return null;
        return (
          <Popconfirm
            title="Cancel this promotion?"
            onConfirm={() => handleCancel(record.id as string)}
            okText="Yes, cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Cancel Promotion">
              <Button
                icon={<StopOutlined />}
                size="small"
                danger
                loading={cancelling}
              >
                Cancel
              </Button>
            </Tooltip>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space>
        <RocketOutlined style={{ fontSize: 20, color: "#fa8c16" }} />
        <Title level={4} style={{ margin: 0 }}>
          Promotions
        </Title>
      </Space>

      <Alert
        type="info"
        showIcon
        message="Viewing Admin's Promotions"
        description="The API returns promotions for the authenticated user (admin account). A GET /admin/promotions endpoint is needed to view all users' promotions."
      />

      <Table
        dataSource={promotions}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total,
          showTotal: (t) => `${t} promotions`,
          onChange: setPage,
        }}
      />
    </Space>
  );
};

// Need useState import
import { useState } from "react";
