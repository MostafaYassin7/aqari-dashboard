import { useShow, useNavigation, useCustomMutation, useNotification, useInvalidate } from "@refinedev/core";
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Button,
  Descriptions,
  Image,
  Spin,
  Divider,
  Popconfirm,
} from "antd";
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  UserOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL } from "../../config";

const { Title, Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  published: "green",
  paused: "orange",
  paused_temp: "gold",
  pending: "blue",
  expired: "red",
};

export const ListingShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { list } = useNavigation();
  const { open } = useNotification();
  const invalidate = useInvalidate();

  const { queryResult } = useShow({ resource: "listings", id });
  const { data, isLoading } = queryResult;
  const rawData = data?.data as Record<string, unknown>;
  const listing = (rawData?.data as Record<string, unknown>) || rawData || {};

  const { mutate: updateStatus, isLoading: updating } = useCustomMutation();
  const { mutate: deleteListing, isLoading: deleting } = useCustomMutation();

  const handleStatusChange = (status: string) => {
    updateStatus(
      { url: `${API_URL}/listings/${id}/status`, method: "patch", values: { status } },
      {
        onSuccess: () => {
          open?.({ type: "success", message: `Status set to ${status}` });
          invalidate({ resource: "listings", invalidates: ["detail"] });
        },
        onError: (err) => open?.({ type: "error", message: err?.message || "Failed" }),
      }
    );
  };

  const handleDelete = () => {
    deleteListing(
      { url: `${API_URL}/listings/${id}`, method: "delete", values: {} },
      {
        onSuccess: () => {
          open?.({ type: "success", message: "Listing deleted" });
          list("listings");
        },
        onError: (err) => open?.({ type: "error", message: err?.message || "Failed" }),
      }
    );
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  const media = (listing.mediaUrls as string[]) || [];
  const owner = listing.owner as Record<string, unknown>;
  const status = listing.status as string;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row justify="space-between" align="middle">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => list("listings")}>
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            {(listing.title as string) || `Listing #${id}`}
          </Title>
          <Tag color={STATUS_COLOR[status] || "default"}>{status?.toUpperCase()}</Tag>
        </Space>
        <Space>
          {status === "published" ? (
            <Button
              icon={<PauseCircleOutlined />}
              loading={updating}
              onClick={() => handleStatusChange("paused_temp")}
            >
              Pause
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={updating}
              onClick={() => handleStatusChange("published")}
            >
              Publish
            </Button>
          )}
          <Popconfirm title="Delete this listing?" onConfirm={handleDelete} okText="Yes">
            <Button danger icon={<DeleteOutlined />} loading={deleting}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          {/* Media */}
          {media.length > 0 && (
            <Card title="Photos" style={{ marginBottom: 16 }}>
              <Image.PreviewGroup>
                <Space wrap>
                  {media.map((url, i) => (
                    <Image
                      key={i}
                      src={url}
                      width={120}
                      height={90}
                      style={{ objectFit: "cover", borderRadius: 6 }}
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            </Card>
          )}

          <Card title="Listing Details">
            <Descriptions column={{ xs: 1, sm: 2 }} labelStyle={{ fontWeight: 600 }}>
              <Descriptions.Item label="ID">{listing.id as string || "—"}</Descriptions.Item>
              <Descriptions.Item label="Ad Number">{listing.adNumber as string || "—"}</Descriptions.Item>
              <Descriptions.Item label="Title" span={2}>{listing.title as string || "—"}</Descriptions.Item>
              <Descriptions.Item label="Property Type">
                {(listing.propertyType as string) || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Listing Type">
                <Tag>{(listing.listingType as string)?.replace("_", " ").toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Price">
                {listing.totalPrice
                  ? `SAR ${Number(listing.totalPrice).toLocaleString()}`
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Area">
                {listing.area ? `${listing.area} m²` : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Bedrooms">{listing.bedrooms as number || "—"}</Descriptions.Item>
              <Descriptions.Item label="Bathrooms">{listing.bathrooms as number || "—"}</Descriptions.Item>
              <Descriptions.Item label="Usage Type">{listing.usageType as string || "—"}</Descriptions.Item>
              <Descriptions.Item label="Furnished">
                {listing.isFurnished === true
                  ? "Yes"
                  : listing.isFurnished === false
                  ? "No"
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="City">{listing.city as string || "—"}</Descriptions.Item>
              <Descriptions.Item label="District">{listing.district as string || "—"}</Descriptions.Item>
              <Descriptions.Item label="Created">
                {listing.createdAt
                  ? new Date(listing.createdAt as string).toLocaleString()
                  : "—"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {owner && (
            <Card title={<><UserOutlined /> Owner</>}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text strong>{(owner.name as string) || "—"}</Text>
                <Text type="secondary">{owner.phone as string || "—"}</Text>
                <Text type="secondary">{owner.email as string || "—"}</Text>
                <Button
                  block
                  onClick={() => navigate(`/users/${owner.id}`)}
                >
                  View Profile
                </Button>
              </Space>
            </Card>
          )}

          <Card title={<><EnvironmentOutlined /> Location</>} style={{ marginTop: 16 }}>
            <Descriptions column={1}>
              <Descriptions.Item label="City">{listing.city as string || "—"}</Descriptions.Item>
              <Descriptions.Item label="District">{listing.district as string || "—"}</Descriptions.Item>
              <Descriptions.Item label="Latitude">{listing.latitude as number || "—"}</Descriptions.Item>
              <Descriptions.Item label="Longitude">{listing.longitude as number || "—"}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Amenities" style={{ marginTop: 16 }}>
            <Space wrap>
              {!!listing.hasElevator && <Tag color="green">Elevator</Tag>}
              {!!listing.hasKitchen && <Tag color="green">Kitchen</Tag>}
              {!!listing.hasWater && <Tag color="green">Water</Tag>}
              {!!listing.hasElectricity && <Tag color="green">Electricity</Tag>}
              {!!listing.hasSewage && <Tag color="green">Sewage</Tag>}
              {!listing.hasElevator && !listing.hasKitchen && !listing.hasWater && (
                <Text type="secondary">No amenities listed</Text>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
};
