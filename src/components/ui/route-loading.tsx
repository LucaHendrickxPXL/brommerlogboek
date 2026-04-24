import { Paper, SimpleGrid, Skeleton, Stack } from "@mantine/core";

function LoadingCard({ height }: { height: number }) {
  return (
    <Paper className="surface-card" withBorder>
      <Skeleton height={height} radius="lg" />
    </Paper>
  );
}

function LoadingList({ count, height }: { count: number; height: number }) {
  return (
    <Stack gap="md">
      {Array.from({ length: count }, (_, index) => (
        <LoadingCard key={index} height={height} />
      ))}
    </Stack>
  );
}

export function SummaryRouteLoading() {
  return (
    <Stack gap="xl">
      <Paper className="surface-card home-summary-card" withBorder>
        <Stack gap="lg">
          <Skeleton height={40} width="32%" radius="lg" />
          <Skeleton height={18} width="56%" radius="lg" />
          <SimpleGrid cols={{ base: 1, xs: 2 }}>
            <Skeleton height={56} radius="xl" />
            <Skeleton height={56} radius="xl" />
            <Skeleton height={56} radius="xl" />
            <Skeleton height={56} radius="xl" />
          </SimpleGrid>
        </Stack>
      </Paper>

      <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }}>
        <LoadingCard height={96} />
        <LoadingCard height={96} />
        <LoadingCard height={96} />
        <LoadingCard height={96} />
      </SimpleGrid>

      <LoadingList count={3} height={132} />
    </Stack>
  );
}

interface ListRouteLoadingProps {
  showActionCard?: boolean;
  listCardHeight?: number;
}

export function ListRouteLoading({
  showActionCard = true,
  listCardHeight = 152,
}: ListRouteLoadingProps) {
  return (
    <Stack gap="xl">
      {showActionCard ? (
        <Paper className="surface-card" withBorder>
          <Stack gap="md">
            <Skeleton height={24} width="26%" radius="lg" />
            <SimpleGrid cols={{ base: 1, xs: 2 }}>
              <Skeleton height={44} radius="xl" />
              <Skeleton height={44} radius="xl" />
            </SimpleGrid>
          </Stack>
        </Paper>
      ) : null}

      <SimpleGrid cols={{ base: 1, xs: 3 }}>
        <LoadingCard height={88} />
        <LoadingCard height={88} />
        <LoadingCard height={88} />
      </SimpleGrid>

      <Stack gap="md">
        <Skeleton height={24} width="22%" radius="lg" />
        <LoadingList count={3} height={listCardHeight} />
      </Stack>
    </Stack>
  );
}

export function DetailRouteLoading() {
  return (
    <Stack gap="xl">
      <LoadingCard height={188} />

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <Skeleton height={44} radius="xl" />
        <Skeleton height={44} radius="xl" />
        <Skeleton height={44} radius="xl" />
        <Skeleton height={44} radius="xl" />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <LoadingCard height={128} />
        <LoadingCard height={128} />
      </SimpleGrid>

      <LoadingList count={3} height={120} />
    </Stack>
  );
}

export function FormRouteLoading() {
  return (
    <Stack gap="xl">
      <Stack gap="sm">
        <Skeleton height={40} width="46%" radius="lg" />
        <Skeleton height={18} width="60%" radius="lg" />
      </Stack>

      <Paper className="surface-card" withBorder>
        <Stack gap="lg">
          <Skeleton height={46} radius="md" />
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Skeleton height={78} radius="md" />
            <Skeleton height={78} radius="md" />
            <Skeleton height={78} radius="md" />
            <Skeleton height={78} radius="md" />
          </SimpleGrid>
          <Skeleton height={132} radius="md" />
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Skeleton height={44} radius="xl" />
            <Skeleton height={44} radius="xl" />
          </SimpleGrid>
        </Stack>
      </Paper>
    </Stack>
  );
}
