"use server"

import { createClient } from "@/utils/supabase/server"

export const fetchSharedFormData = async (subjectId: string, currentFacultyId: string) => {
  try {
    const supabase = await createClient()

    console.log("🔍 Fetching shared data for subject:", subjectId, "current faculty:", currentFacultyId)

    // Get all faculty assigned to this subject
    const { data: facultyRoles, error: facultyError } = await supabase
      .from("user_role")
      .select("user_id")
      .eq("subject_id", subjectId)
      .eq("role_name", "Faculty")

    if (facultyError) {
      console.error("Error fetching faculty roles:", facultyError)
      return { success: false, error: "Failed to fetch faculty assignments" }
    }

    console.log("👥 Faculty roles found:", facultyRoles)

    if (!facultyRoles || facultyRoles.length <= 1) {
      console.log("📝 Not a shared subject or only one faculty")
      return { success: true, isShared: false, sharedData: null }
    }

    // Get forms from other faculty (not current user)
    const otherFacultyIds = facultyRoles.map((fr) => fr.user_id).filter((id) => id !== currentFacultyId)

    console.log("👤 Other faculty IDs:", otherFacultyIds)

    if (otherFacultyIds.length === 0) {
      console.log("📝 No other faculty found")
      return { success: true, isShared: false, sharedData: null }
    }

    // Fetch forms from other faculty
    const { data: sharedForms, error: formsError } = await supabase
      .from("forms")
      .select("id, form, faculty_id")
      .eq("subject_id", subjectId)
      .in("faculty_id", otherFacultyIds)

    if (formsError) {
      console.error("Error fetching shared forms:", formsError)
      return { success: false, error: "Failed to fetch shared forms" }
    }

    console.log("📋 Shared forms found:", sharedForms)

    // Get faculty names separately
    const { data: facultyData, error: facultyDataError } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", otherFacultyIds)

    if (facultyDataError) {
      console.error("Error fetching faculty data:", facultyDataError)
      return { success: false, error: "Failed to fetch faculty data" }
    }

    console.log("👥 Faculty data:", facultyData)

    // Combine data
    const combinedForms = sharedForms?.map((form) => {
      const faculty = facultyData?.find((f) => f.id === form.faculty_id)
      return {
        ...form,
        users: faculty || { name: "Unknown", email: "" },
      }
    })

    console.log("🔗 Combined forms:", combinedForms)

    return {
      success: true,
      isShared: true,
      sharedData: combinedForms || [],
    }
  } catch (error) {
    console.error("Error in fetchSharedFormData:", error)
    return { success: false, error: "Internal server error" }
  }
}
