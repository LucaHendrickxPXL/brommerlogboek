import { Avatar, Group, Stack, Text } from "@mantine/core";

interface VehicleAvatarProps {
  name: string;
  subtitle: string;
  photoUrl?: string;
  size?: number;
}

export function VehicleAvatar({
  name,
  subtitle,
  photoUrl,
  size = 56,
}: VehicleAvatarProps) {
  return (
    <Group gap="md" wrap="nowrap">
      <Avatar src={photoUrl} size={size} radius="xl" color="teal">
        {name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()}
      </Avatar>
      <Stack gap={2}>
        <Text fw={700}>{name}</Text>
        <Text size="sm" c="dimmed">
          {subtitle}
        </Text>
      </Stack>
    </Group>
  );
}
