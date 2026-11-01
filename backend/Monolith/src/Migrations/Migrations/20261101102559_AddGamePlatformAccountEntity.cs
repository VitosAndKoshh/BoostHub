using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Migrations.Migrations
{
    /// <inheritdoc />
    public partial class AddGamePlatformAccountEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "steam_id",
                table: "accounts");

            migrationBuilder.CreateTable(
                name: "game_platform_accounts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    platform = table.Column<string>(type: "text", nullable: false),
                    platform_user_id = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_game_platform_accounts", x => x.id);
                    table.ForeignKey(
                        name: "FK_game_platform_accounts_accounts_account_id",
                        column: x => x.account_id,
                        principalTable: "accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_game_platform_accounts_account_id",
                table: "game_platform_accounts",
                column: "account_id");

            migrationBuilder.CreateIndex(
                name: "IX_game_platform_accounts_platform_platform_user_id",
                table: "game_platform_accounts",
                columns: new[] { "platform", "platform_user_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "game_platform_accounts");

            migrationBuilder.AddColumn<string>(
                name: "steam_id",
                table: "accounts",
                type: "text",
                nullable: true);
        }
    }
}
