"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_BASE = "http://localhost:8080/order-bac";

type OrderItem = {
  id?: number | string;
  code?: string;
  number?: number;
  created_at?: string;
  restaurant_name?: string;
  [key: string]: unknown;
};

type OrderResponse =
  | {
      count?: number;
      orders?: OrderItem[];
      [key: string]: unknown;
    }
  | OrderItem[]
  | Record<string, unknown>;

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const fallbackId = Array.isArray(rawId) ? rawId[0] ?? "" : rawId ?? "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [activeId, setActiveId] = useState<string>(fallbackId);

  useEffect(() => {
    const token = window.localStorage.getItem("access_token");

    if (!token) {
      router.replace("/");
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      setOrderData(null);

      if (!fallbackId) {
        setError("Unable to determine restaurant id from URL.");
        setActiveId("");
        setLoading(false);
        return;
      }

      setActiveId(fallbackId);

      const endpoint = `${API_BASE}/${fallbackId}`;

      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          window.localStorage.removeItem("access_token");
          router.replace("/");
          return;
        }

        const rawText = await response.text();
        let parsedBody: unknown = null;

        if (rawText) {
          try {
            parsedBody = JSON.parse(rawText);
          } catch {
            parsedBody = rawText;
          }
        }

        if (!response.ok) {
          const message =
            typeof parsedBody === "object" && parsedBody !== null && "message" in parsedBody
              ? String((parsedBody as { message: unknown }).message)
              : `Order request failed with status ${response.status}`;

          throw new Error(message);
        }

        setOrderData(parsedBody as OrderResponse);
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : "Failed to load order.";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [fallbackId, router]);

  const renderOrderTable = () => {
    if (loading) {
      return <div className="status info">Thông tin đơn hàng</div>;
    }

    if (error) {
      return (
        <div className="status error">
          <strong>{error}</strong>
          <small>Confirm the order endpoint is reachable and the ID exists.</small>
        </div>
      );
    }

    if (!orderData) {
      return <div className="status info">Order response was empty.</div>;
    }

    if (Array.isArray(orderData)) {
      return (
        <div className="table-wrapper">
          <table className="data-table orders">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã hàng</th>
                <th>Số lượng</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {orderData.map((item, index) => {
                const safeItem = typeof item === "object" && item !== null ? (item as OrderItem) : {};
                const sequence = index + 1;
                const code = safeItem.code ?? "-";
                const quantity =
                  typeof safeItem.number === "number" || typeof safeItem.number === "string"
                    ? safeItem.number
                    : "-";
                const createdAt = safeItem.created_at ?? "-";

                return (
                  <tr key={sequence ?? index}>
                    <td className="sequence-cell">{sequence}</td>
                    <td className="code-cell">{code}</td>
                    <td>{quantity}</td>
                    <td>{createdAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (typeof orderData === "object" && orderData !== null) {
      const { count, restaurant_name, orders, ...rest } = orderData as {
        count?: number;
        restaurant_name?: string;
        orders?: OrderItem[];
      };
      const list = Array.isArray(orders) ? orders : [];

      return (
        <>
          <div className="status info">
            <strong>Tổng số: {typeof count === "number" ? count : list.length}</strong>
          </div>
          <div className="status info">
            <strong>Nhà hàng: {restaurant_name ?? "-"}</strong>
          </div>
          {list.length > 0 ? (
            <div className="table-wrapper">
              <table className="data-table orders">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã hàng</th>
                    <th>Số lượng</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
              {list.map((item, index) => {
                const sequence = index + 1;
                const code = item.code ?? "-";
                const quantity =
                  typeof item.number === "number" || typeof item.number === "string"
                    ? item.number
                    : "-";
                    const createdAt = item.created_at ?? "-";

                    return (
                      <tr key={sequence ?? index}>
                        <td className="sequence-cell">{sequence}</td>
                        <td className="code-cell">{code}</td>
                        <td>{quantity}</td>
                        <td>{createdAt}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="status info">No orders were returned.</div>
          )}
          {Object.keys(rest).length > 0 && (
            <div className="status info">
              <small>Additional data: {formatValue(rest)}</small>
            </div>
          )}
        </>
      );
    }

    return <div className="status info">{formatValue(orderData)}</div>;
  };

  return (
    <section className="profile-card order-card">
      <header>
        <h1>Demo issue broken access control</h1>
        <p>
          Danh sách nguyên liệu đã đặt hàng. Có thể xem danh sách của bất kỳ nhà hàng nào.
        </p>
      </header>

      {renderOrderTable()}

      <div className="action-buttons single">
        <button type="button" className="action-button active" onClick={() => router.push("/profile")}>
          Back to profile
        </button>
      </div>
    </section>
  );
}

function formatValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value === null || typeof value === "undefined") {
    return "-";
  }

  if (Array.isArray(value)) {
    return value.map(formatValue).join(", ");
  }

  if (typeof value === "object") {
    if (Object.keys(value as Record<string, unknown>).length === 0) {
      return "-";
    }
    return JSON.stringify(value);
  }

  return String(value);
}
