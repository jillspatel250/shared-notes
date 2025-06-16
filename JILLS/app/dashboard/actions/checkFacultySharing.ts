// "use server"

// // This function now calls the API route instead of directly accessing the database
// export const checkFacultySharing = async (subjectId: string) => {
//   try {
//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/faculty-sharing?subjectId=${subjectId}`,
//       {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       },
//     )

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`)
//     }

//     const result = await response.json()
//     return result
//   } catch (error) {
//     console.error("Error in checkFacultySharing:", error)
//     return {
//       success: false,
//       error: "An unexpected error occurred",
//       isSharing: false,
//       allFaculty: [],
//       primaryFaculty: null,
//       secondaryFaculty: [],
//     }
//   }
// }


"use server"

import { createClient } from "@/utils/supabase/server"

export const checkFacultySharing = async (subjectId: string) => {
  try {
    if (!subjectId) {
      return {
        success: false,
        error: "Subject ID is required",
        isSharing: false,
        allFaculty: [],
        primaryFaculty: null,
        secondaryFaculty: [],
      }
    }

    const supabase = await createClient()

    // Get all faculty assigned to this subject using user_role table
    const { data: facultyRoles, error: facultyError } = await supabase
      .from("user_role")
      .select(`
        user_id,
        users!user_role_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq("subject_id", subjectId)
      .eq("role_name", "Faculty")

    if (facultyError) {
      console.error("Error fetching faculty subjects:", facultyError)

      // If the foreign key relationship doesn't exist, try a different approach
      if (facultyError.code === "PGRST200") {
        // Fallback: Get faculty IDs first, then get user details separately
        const { data: facultyMappings, error: mappingError } = await supabase
          .from("user_role")
          .select("user_id")
          .eq("subject_id", subjectId)
          .eq("role_name", "Faculty")

        if (mappingError) {
          console.error("Error fetching faculty mappings:", mappingError)
          return {
            success: false,
            error: "Failed to fetch faculty assignments",
            isSharing: false,
            allFaculty: [],
            primaryFaculty: null,
            secondaryFaculty: [],
          }
        }

        if (!facultyMappings || facultyMappings.length === 0) {
          return {
            success: true,
            isSharing: false,
            allFaculty: [],
            primaryFaculty: null,
            secondaryFaculty: [],
          }
        }

        // Get user details for the faculty IDs
        const facultyIds = facultyMappings.map((fm) => fm.user_id)
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id, name, email")
          .in("id", facultyIds)

        if (usersError) {
          console.error("Error fetching user details:", usersError)
          return {
            success: false,
            error: "Failed to fetch faculty details",
            isSharing: false,
            allFaculty: [],
            primaryFaculty: null,
            secondaryFaculty: [],
          }
        }

        // Combine the data
        const combinedData = facultyMappings.map((mapping) => {
          const user = users?.find((u) => u.id === mapping.user_id)
          return {
            user_id: mapping.user_id,
            users: user || { id: mapping.user_id, name: "Unknown", email: "" },
          }
        })

        // Process the combined data
        const isSharing = combinedData && combinedData.length > 1
        const allFaculty =
          combinedData?.map((fs: any) => ({
            id: fs.users.id,
            name: fs.users.name,
            email: fs.users.email,
          })) || []

        const primaryFaculty = allFaculty[0] || null // First faculty as primary
        const secondaryFaculty = allFaculty.slice(1) // Rest as secondary

        return {
          success: true,
          isSharing,
          allFaculty,
          primaryFaculty,
          secondaryFaculty,
        }
      }

      return {
        success: false,
        error: "Failed to fetch faculty assignments",
        isSharing: false,
        allFaculty: [],
        primaryFaculty: null,
        secondaryFaculty: [],
      }
    }

    // Check if subject is shared (more than one faculty)
    const isSharing = facultyRoles && facultyRoles.length > 1

    // Organize faculty data
    const allFaculty =
      facultyRoles?.map((fr: any) => ({
        id: fr.users.id,
        name: fr.users.name,
        email: fr.users.email,
      })) || []

    const primaryFaculty = allFaculty[0] || null // First faculty as primary
    const secondaryFaculty = allFaculty.slice(1) // Rest as secondary

    return {
      success: true,
      isSharing,
      allFaculty,
      primaryFaculty,
      secondaryFaculty,
    }
  } catch (error) {
    console.error("Error in checkFacultySharing server action:", error)
    return {
      success: false,
      error: "Internal server error",
      isSharing: false,
      allFaculty: [],
      primaryFaculty: null,
      secondaryFaculty: [],
    }
  }
}
