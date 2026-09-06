import * as React from "react";

interface UsePaginationOptions {
  totalItems: number;
  initialPage?: number;
  initialPageSize?: number;
  siblingCount?: number;
}

interface UsePaginationResult {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: isFirstPage: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  pages: (number | "...")[];
  setPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  setPageSize: (size: number) => void;
}

function generatePaginationPages(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): (number | "...")[] {
  const totalNumbers = siblingCount * 2 + 3;
  const totalBlocks = totalNumbers + 2;

  if (totalPages <= totalBlocks) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, "...", totalPages];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    );
    return [1, "...", ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i
  );
  return [1, "...", ...middleRange, "...", totalPages];
}

function usePagination({
  totalItems,
  initialPage = 1,
  initialPageSize = 10,
  siblingCount = 1,
}: UsePaginationOptions): UsePaginationResult {
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [pageSize, setPageSizeState] = React.useState(initialPageSize);

  const totalPages = React.useMemo(
    () => Math.ceil(totalItems / pageSize),
    [totalItems, pageSize]
  );

  const startIndex = React.useMemo(
    () => (currentPage - 1) * pageSize,
    [currentPage, pageSize]
  );

  const endIndex = React.useMemo(
    () => Math.min(startIndex + pageSize - 1, totalItems - 1),
    [startIndex, pageSize, totalItems]
  );

  const pages = React.useMemo(
    () => generatePaginationPages(currentPage, totalPages, siblingCount),
    [currentPage, totalPages, siblingCount]
  );

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;
  const hasNextPage = !isLastPage;
  const hasPreviousPage = !isFirstPage;

  const setPage = React.useCallback(
    (page: number) => {
      const clampedPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(clampedPage);
    },
    [totalPages]
  );

  const nextPage = React.useCallback(() => {
    if (!isLastPage) {
      setCurrentPage((p) => p + 1);
    }
  }, [isLastPage]);

  const previousPage = React.useCallback(() => {
    if (!isFirstPage) {
      setCurrentPage((p) => p - 1);
    }
  }, [isFirstPage]);

  const firstPage = React.useCallback(() => {
    setCurrentPage(1);
  }, []);

  const lastPage = React.useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const setPageSize = React.useCallback(
    (size: number) => {
      setPageSizeState(size);
      const newTotalPages = Math.ceil(totalItems / size);
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages || 1);
      }
    },
    [totalItems, currentPage]
  );

  React.useEffect(() => {
    if (totalItems > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [totalItems, currentPage, totalPages]);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    isFirstPage,
    isLastPage,
    pages,
    setPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize,
  };
}

export { usePagination };
