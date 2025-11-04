"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PROFILE_ENDPOINT = "http://localhost:8080/profile";

type ProfilePayload = {
  restaurant_name?: string;
  user_name?: string;
  restaurant_id?: string | number;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  function handleIssueClick() {
    if (!restaurantId) {
      setError("Unable to determine restaurant id from profile.");
      return;
    }
    router.push(`/order-bac/${encodeURIComponent(restaurantId)}`);
  }

  function handleSolutionClick() {
    if (!restaurantId) {
      setError("Unable to determine restaurant id from profile.");
      return;
    }
    router.push(`/order/${encodeURIComponent(restaurantId)}`);
  }

  useEffect(() => {
    const token = window.localStorage.getItem("access_token");

    if (!token) {
      setError("Missing access token. Please log in again.");
      router.replace("/");
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(PROFILE_ENDPOINT, {
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
              : `Profile request failed with status ${response.status}`;

          throw new Error(message);
        }

        if (typeof parsedBody === "object" && parsedBody !== null && !Array.isArray(parsedBody)) {
          const payload = parsedBody as ProfilePayload;
          setProfile(payload);

          const id = payload.restaurant_id;
          if (typeof id === "string" || typeof id === "number") {
            setRestaurantId(String(id));
          } else {
            setRestaurantId(null);
          }
        } else {
          setProfile(null);
          setRestaurantId(null);
        }
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : "Failed to load profile.";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const renderProfile = () => {
    if (loading) {
      return <div className="status info">Loading profile…</div>;
    }

    if (error) {
      return (
        <div className="status error">
          <strong>{error}</strong>
          <small>Try logging in again or verify the API is reachable.</small>
        </div>
      );
    }

    if (!profile) {
      return <div className="status info">Profile response did not include expected fields.</div>;
    }

    const restaurantName = profile.restaurant_name ?? "-";
    const userName = profile.user_name ?? "-";

    return (
      <div className="profile-details simple">
        <div className="profile-row">
          <span className="profile-key">Tên nhà hàng</span>
          <span className="profile-value">{restaurantName}</span>
        </div>
        <div className="profile-row">
          <span className="profile-key">Tên người dùng</span>
          <span className="profile-value">{userName}</span>
        </div>
      </div>
    );
  };

  return (
    <section className="profile-card">
      <header>
        <h1>Your profile</h1>
      </header>

      {renderProfile()}

      <div className="action-buttons">
        <button type="button" className="action-button" onClick={handleIssueClick}>
          Issue
        </button>
        <button type="button" className="action-button" onClick={handleSolutionClick}>
          Solution
        </button>
      </div>
    </section>
  );
}
