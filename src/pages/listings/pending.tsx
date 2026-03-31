import { useEffect, useRef, useState } from "react";
import { axiosInstance } from "../../dataProvider";
import { useList, useCustomMutation, useNotification, useInvalidate } from "@refinedev/core";
import {
  Table,
  Space,
  Typography,
  Tag,
  Button,
  Drawer,
  Popconfirm,
  Tooltip,
  Alert,
  Badge,
  Row,
  Col,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { TableRowSelection } from "antd/es/table/interface";
import { API_URL } from "../../config";
import { ListingDetailPanel } from "../../components/listings/ListingDetailPanel";
import { TableSkeleton } from "../../components/common/TableSkeleton";

const { Title, Text } = Typography;

export const PendingListingList: React.FC = () => {
  const { open } = useNotification();
  const invalidate = useInvalidate();
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerListing, setDrawerListing] = useState<Record<string, unknown> | null>(null);
  const prevTotalRef = useRef<number | null>(null);

  const { data, isLoading, refetch } = useList({
    resource: "listings",
    filters: [{ field: "status", operator: "eq", value: "pending" }],
    pagination: { current: page, pageSize: 20 },
    queryOptions: { refetchInterval: 60_000 },
  });

  const listings = (data?.data || []) as Array<Record<string, unknown>>;
  const total = data?.total || 0;

  // Toast when new pending listings arrive
  useEffect(() => {
    if (prevTotalRef.current !== null && total > prevTotalRef.current) {
      const diff = total - prevTotalRef.current;
      open?.({
        type: "success",
        message: `${diff} new pending listing${diff > 1 ? "s" : ""} arrived`,
      });
    }
    prevTotalRef.current = total;
  }, [total, open]);

  const { mutate: updateStatus, isLoading: updating } = useCustomMutation();
  const { mutate: deleteListing, isLoading: deleting } = useCustomMutation();

  const handleStatus = (id: string, status: "published" | "paused") => {
    updateStatus(
      { url: `${API_URL}/listings/${id}/status`, method: "patch", values: { status } },
      {
        onSuccess: () => {
          open?.({ type: "success", message: `Listing ${status === "published" ? "published" : "rejected"}` });
          invalidate({ resource: "listings", invalidates: ["list"] });
        },
        onError: (err) => open?.({ type: "error", message: err?.message || "Action failed" }),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteListing(
      { url: `${API_URL}/listings/${id}`, method: "delete", values: {} },
      {
        onSuccess: () => {
          open?.({ type: "success", message: "Listing deleted" });
          invalidate({ resource: "listings", invalidates: ["list"] });
        },
        onError: (err) => open?.({ type: "error", message: err?.message || "Delete failed" }),
      }
    );
  };

  const handleBulkStatus = async (status: "published" | "paused") => {
    if (!selectedIds.length) return;
    open?.({ type: "success", message: `Processing ${selectedIds.length} listings…` });
    await Promise.allSettled(
      selectedIds.map((id) =>
        axiosInstance.patch(`/listings/${id}/status`, { status })
      )
    );
    open?.({ type: "success", message: `Done — ${selectedIds.length} listings ${status === "published" ? "published" : "rejected"}` });
    setSelectedIds([]);
    invalidate({ resource: "listings", invalidates: ["list"] });
  };

  const rowSelection: TableRowSelection<Record<string, unknown>> = {
    selectedRowKeys: selectedIds,
    onChange: (keys) => setSelectedIds(keys as string[]),
  };

  const columns = [
    {
      title: "Ad Number",
      dataIndex: "adNumber",
      key: "adNumber",
      render: (v: string) => <Text code>{v || "—"}</Text>,
    },
    {
      title: "Title",
      key: "title",
      render: (_: unknown, record: Record<string, unknown>) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {(record.title as string) || "—"}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.city as string} · {record.district as string}
          </Text>
        </div>
      ),
    },
    {
      title: "Category",
      key: "category",
      render: (_: unknown, record: Record<string, unknown>) => {
        const cat = record.category as Record<string, unknown>;
        return <Text>{(cat?.name as string) || "—"}</Text>;
      },
    },
    {
      title: "Type",
      key: "type",
      render: (_: unknown, record: Record<string, unknown>) => (
        <Tag>{(record.listingType as string)?.replace("_", " ").toUpperCase()}</Tag>
      ),
    },
    {
      title: "Price",
      dataIndex: "totalPrice",
      key: "price",
      render: (v: string) =>
        v ? <Text>SAR {Number(v).toLocaleString()}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: "Owner",
      key: "owner",
      render: (_: unknown, record: Record<string, unknown>) => {
        const owner = record.owner as Record<string, unknown>;
        return owner ? (
          <div>
            <Text>{(owner.name as string) || "—"}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {owner.phone as string}
            </Text>
          </div>
        ) : (
          <Text type="secondary">—</Text>
        );
      },
    },
    {
      title: "Submitted",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) =>
        v ? <Text style={{ fontSize: 12 }}>{new Date(v).toLocaleString()}</Text> : "—",
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_: unknown, record: Record<string, unknown>) => {
        const id = record.id as string;
        return (
          <Space size="small">
            <Tooltip title="View details">
              <Button
                icon={<EyeOutlined />}
                size="small"
                onClick={() => setDrawerListing(record)}
              />
            </Tooltip>
            <Tooltip title="Publish">
              <Popconfirm
                title="Publish this listing?"
                onConfirm={() => handleStatus(id, "published")}
                okText="Publish"
              >
                <Button
                  icon={<CheckCircleOutlined />}
                  size="small"
                  type="primary"
                  loading={updating}
                />
              </Popconfirm>
            </Tooltip>
            <Tooltip title="Reject">
              <Popconfirm
                title="Reject and pause this listing?"
                onConfirm={() => handleStatus(id, "paused")}
                okText="Reject"
                okButtonProps={{ danger: true }}
              >
                <Button
                  icon={<CloseCircleOutlined />}
                  size="small"
                  danger
                  loading={updating}
                />
              </Popconfirm>
            </Tooltip>
            <Tooltip title="Delete">
              <Popconfirm
                title="Permanently delete this listing?"
                onConfirm={() => handleDelete(id)}
                okText="Delete"
                okButtonProps={{ danger: true }}
              >
                <Button icon={<DeleteOutlined />} size="small" danger loading={deleting} />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row justify="space-between" align="middle">
        <Space>
          <ClockCircleOutlined style={{ fontSize: 20, color: "#fa8c16" }} />
          <Title level={4} style={{ margin: 0 }}>
            Pending Listings
          </Title>
          <Badge count={total} style={{ background: "#ff4d4f" }} />
        </Space>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          Refresh
        </Button>
      </Row>

      <Alert
        type="info"
        showIcon
        message="Auto-refreshes every 60 seconds. You'll be notified when new listings arrive."
      />

      {selectedIds.length > 0 && (
        <Space>
          <Text>{selectedIds.length} selected</Text>
          <Popconfirm
            title={`Publish ${selectedIds.length} listings?`}
            onConfirm={() => handleBulkStatus("published")}
            okText="Publish All"
          >
            <Button type="primary" icon={<CheckCircleOutlined />}>
              Bulk Publish
            </Button>
          </Popconfirm>
          <Popconfirm
            title={`Reject ${selectedIds.length} listings?`}
            onConfirm={() => handleBulkStatus("paused")}
            okText="Reject All"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<CloseCircleOutlined />}>
              Bulk Reject
            </Button>
          </Popconfirm>
          <Button onClick={() => setSelectedIds([])}>Clear</Button>
        </Space>
      )}

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <Table
          dataSource={listings}
          columns={columns}
          rowKey="id"
          rowSelection={rowSelection}
          pagination={{
            current: page,
            pageSize: 20,
            total,
            showTotal: (t) => `${t} pending`,
            onChange: setPage,
          }}
          scroll={{ x: 900 }}
          locale={{ emptyText: "No pending listings — all clear!" }}
        />
      )}

      {/* Detail Drawer */}
      <Drawer
        title="Listing Details"
        open={!!drawerListing}
        onClose={() => setDrawerListing(null)}
        width={480}
        placement="right"
      >
        {drawerListing && <ListingDetailPanel listing={drawerListing} />}
      </Drawer>
    </Space>
  );
};
