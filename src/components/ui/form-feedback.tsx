import { Alert, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

export function FormFeedback({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <Alert color="rose" variant="light" icon={<IconAlertCircle size={18} stroke={2} />}>
      {message}
    </Alert>
  );
}

export function FieldErrorText({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <Text size="sm" c="rose.7">
      {message}
    </Text>
  );
}
