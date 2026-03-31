import { Descriptions, Image, Space, Tag, Typography, Divider } from "antd";

const { Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  published: "green",
  paused: "orange",
  paused_temp: "gold",
  pending: "blue",
  expired: "red",
};

interface Props {
  listing: Record<string, unknown>;
}

export const ListingDetailPanel: React.FC<Props> = ({ listing }) => {
  const media = (listing.mediaUrls as string[]) || [];
  const owner = listing.owner as Record<string, unknown> | undefined;
  const category = listing.category as Record<string, unknown> | undefined;

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {media.length > 0 && (
        <Image.PreviewGroup>
          <Space wrap>
            {media.slice(0, 6).map((url, i) => (
              <Image
                key={i}
                src={url}
                width={100}
                height={75}
                style={{ objectFit: "cover", borderRadius: 6 }}
              />
            ))}
          </Space>
        </Image.PreviewGroup>
      )}

      <Descriptions column={1} size="small" bordered labelStyle={{ fontWeight: 600, width: 140 }}>
        <Descriptions.Item label="Ad Number">
          {(listing.adNumber as string) || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Title">
          {(listing.title as string) || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={STATUS_COLOR[(listing.status as string) || ""]}>
            {(listing.status as string)?.toUpperCase()}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Category">
          {(category?.name as string) || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Property Type">
          {(listing.propertyType as string) || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Listing Type">
          {(listing.listingType as string)?.replace("_", " ").toUpperCase() || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Price">
          {listing.totalPrice
            ? `SAR ${Number(listing.totalPrice).toLocaleString()}`
            : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Area">
          {listing.area ? `${listing.area} m²` : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="City / District">
          {[listing.city, listing.district].filter(Boolean).join(" / ") || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Bedrooms / Baths">
          {[listing.bedrooms, listing.bathrooms].map((v) => v ?? "—").join(" / ")}
        </Descriptions.Item>
        <Descriptions.Item label="Usage">
          {(listing.usageType as string) || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Furnished">
          {listing.isFurnished === true
            ? "Yes"
            : listing.isFurnished === false
            ? "No"
            : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Submitted">
          {listing.createdAt
            ? new Date(listing.createdAt as string).toLocaleString()
            : "—"}
        </Descriptions.Item>
      </Descriptions>

      {owner && (
        <>
          <Divider style={{ margin: "8px 0" }} />
          <Text strong>Owner</Text>
          <Descriptions column={1} size="small" bordered labelStyle={{ fontWeight: 600, width: 140 }}>
            <Descriptions.Item label="Name">
              {(owner.name as string) || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {(owner.phone as string) || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {(owner.email as string) || "—"}
            </Descriptions.Item>
          </Descriptions>
        </>
      )}

      {!!listing.description && (
        <>
          <Divider style={{ margin: "8px 0" }} />
          <Text strong>Description</Text>
          <Text style={{ display: "block", whiteSpace: "pre-wrap" }}>
            {listing.description as string}
          </Text>
        </>
      )}
    </Space>
  );
};
