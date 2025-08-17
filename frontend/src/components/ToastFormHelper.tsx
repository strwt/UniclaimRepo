import { useToast } from "@/context/ToastContext";

interface ToastFormParams {
  hasReportTypeError: boolean;
  hasTitleError: boolean;
  hasCategoryError: boolean;
  hasDescriptionError: boolean;
  hasDateTimeError: boolean;
  hasImageError: boolean;
  hasLocationError: boolean;
  hasCoordinatesError: boolean;
}

const useToastFormHelper = () => {
  const { showToast } = useToast();

  const validateFormErrors = (params: ToastFormParams): boolean => {
    const {
      hasReportTypeError,
      hasTitleError,
      hasCategoryError,
      hasDescriptionError,
      hasDateTimeError,
      hasImageError,
      hasLocationError,
      hasCoordinatesError,
    } = params;

    const fieldErrors = [
      hasReportTypeError,
      hasTitleError,
      hasCategoryError,
      hasDescriptionError,
      hasDateTimeError,
      hasImageError,
      hasLocationError,
      hasCoordinatesError,
    ];

    const totalFields = fieldErrors.length;
    const missingFields = fieldErrors.filter(Boolean).length;

    // ✅ All fields are empty
    if (missingFields === totalFields) {
      showToast(
        "error",
        "Form Incomplete",
        "Please fill out the entire form before submitting.",
        6000
      );
      return true;
    }

    // ✅ Show individual toasts only for missing fields
    let hasError = false;

    if (hasReportTypeError) {
      showToast(
        "error",
        "Report Type Missing",
        "Please select whether the item is lost or found.",
        5000
      );
      hasError = true;
    }

    if (hasTitleError) {
      showToast(
        "error",
        "Title Required",
        "Please enter the title of your post.",
        5000
      );
      hasError = true;
    }

    if (hasCategoryError) {
      showToast(
        "error",
        "Item Category Missing",
        "Choose the category of the item.",
        5000
      );
      hasError = true;
    }

    if (hasDescriptionError) {
      showToast(
        "error",
        "Description Required",
        "Please enter a description for the item.",
        5000
      );
      hasError = true;
    }

    if (hasDateTimeError) {
      showToast(
        "error",
        "Date & Time Required",
        "Please select when the item was lost or found.",
        5000
      );
      hasError = true;
    }

    if (hasImageError) {
      showToast(
        "error",
        "Image Upload Required",
        "Upload at least one image of the item.",
        5000
      );
      hasError = true;
    }

    if (hasLocationError) {
      showToast(
        "error",
        "Last Location Missing",
        "Select the last seen location of the item.",
        5000
      );
      hasError = true;
    }

    if (hasCoordinatesError) {
      showToast(
        "error",
        "Location Pin Required",
        "Please pin a location on the map.",
        5000
      );
      hasError = true;
    }

    return hasError;
  };

  return { validateFormErrors };
};

export default useToastFormHelper;
