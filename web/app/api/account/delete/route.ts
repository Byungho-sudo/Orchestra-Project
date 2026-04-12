import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  try {
    const adminClient = createSupabaseAdminClient()
    const { error: projectsError } = await adminClient
      .from("projects")
      .delete()
      .eq("user_id", user.id)

    if (projectsError) {
      return NextResponse.json(
        { error: "Failed to clean up your projects." },
        { status: 500 }
      )
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      user.id
    )

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete your account." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete your account.",
      },
      { status: 500 }
    )
  }
}
